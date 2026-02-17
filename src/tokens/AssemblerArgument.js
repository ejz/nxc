import Token from './Token.js';
import InternalError from '../errors/InternalError.js';
import AssemblerLabel from './AssemblerLabel.js';

export default class AssemblerArgument extends Token {
    tokenize() {
        let token = this.#tokenize();
        return token !== null ? token.finalize() : null;
    }

    #tokenize() {
        this.address = this.eatAddress();
        if (this.address !== null) {
            return this;
        }
        this.integer = this.eatInteger();
        if (this.integer !== null) {
            return this;
        }
        this.sib = this.eatSib();
        if (this.sib !== null) {
            return this;
        }
        this.register = this.eatRegister();
        if (this.register !== null) {
            return this;
        }
        this.label = this.eatLabel();
        if (this.label !== null) {
            return this;
        }
        return null;
    }

    eatInteger() {
        let integer = null;
        this.lexer.try(() => {
            let sign = this.lexer.eatOneOf('+', '-');
            let num = this.lexer.eatNum();
            if (num === null) {
                return false;
            }
            integer = (sign ?? '') + num;
            return true;
        });
        return integer;
    }

    eatAddress() {
        let address = null;
        this.lexer.try(() => {
            let seg = this.eatRegister() ?? this.eatInteger();
            if (!this.lexer.eat(':')) {
                return false;
            }
            let off = this.eatInteger();
            if (off === null) {
                return false;
            }
            address = [seg, off];
            return true;
        });
        return address;
    }

    eatRegister() {
        return this.lexer.eatIdentifier();
    }

    eatSib() {
        if (!this.eatSibStart()) {
            return null;
        }
        let parts = null;
        while (parts === null || !this.eatSibEnd()) {
            let plusMinus = '+';
            if (parts !== null) {
                plusMinus = this.eatPlusMinus();
                if (plusMinus === null) {
                    this.throw();
                }
            }
            let part = this.eatSibPart();
            if (part === null) {
                this.throw();
            }
            part.minus = plusMinus === '-';
            if (part.minus && part.type !== 'integer') {
                this.throw();
            }
            parts ??= [];
            parts.push(part);
        }
        return this.compileSib(parts);
    }

    eatPlusMinus() {
        let plusMinus = null;
        this.lexer.try(() => {
            this.lexer.wcc();
            plusMinus = this.lexer.eatOneOf('+', '-');
            if (plusMinus === null) {
                return false;
            }
            this.lexer.wcc();
            return true;
        });
        return plusMinus;
    }

    eatLabel() {
        return AssemblerLabel.prototype.eat.bind(this)();
    }

    stringify() {
        if (this.address !== null) {
            return this.address.join(':');
        }
        if (this.integer !== null) {
            return this.integer;
        }
        if (this.sib !== null) {
            return this.stringifySib(this.sib);
        }
        if (this.register !== null) {
            return this.register;
        }
        if (this.label !== null) {
            return this.label;
        }
        throw new InternalError;
    }

    stringifySib({scale, index, base, disp, minus}) {
        let sib = '';
        sib += base ?? '';
        if (index !== null) {
            sib += sib !== '' ? ' + ' : '';
            sib += index;
            sib += scale !== null ? ' * ' + scale : '';
        }
        if (disp !== null) {
            sib += sib !== '' ? (minus ? ' - ' : ' + ') : '';
            sib += disp;
        }
        return '[' + sib + ']';
    }

    eatSibStart() {
        return this.lexer.eatSpecialCharacter('[ ');
    }

    eatSibEnd() {
        return this.lexer.eatSpecialCharacter(' ]');
    }

    eatSibPart() {
        let integer = this.eatInteger();
        if (integer !== null) {
            return {type: 'integer', integer};
        }
        let register = this.eatRegister();
        if (register === null) {
            return null;
        }
        let scale = this.eatSibScale();
        return {type: 'register', register, scale};
    }

    eatSibScale() {
        if (!this.lexer.eatSpecialCharacter(' * ')) {
            return null;
        }
        let scale = this.lexer.eatDecNum();
        if (scale === null) {
            this.throw();
        }
        return scale;
    }

    compileSib(parts) {
        let sib = {
            scale: null,
            base: null,
            index: null,
            disp: null,
            minus: false,
        };
        if (parts.length > 3) {
            this.throw();
        }
        for (let part of parts) {
            if (
                part.type === 'integer'
                && sib.disp === null
            ) {
                sib.disp = part.integer;
                sib.minus = part.minus;
                continue;
            }
            if (part.type !== 'register') {
                this.throw();
            }
            if (
                part.scale !== null
                && sib.scale === null
                && sib.index === null
            ) {
                sib.scale = part.scale;
                sib.index = part.register;
                continue;
            }
            if (sib.base === null) {
                sib.base = part.register;
                continue;
            }
            if (sib.index === null) {
                sib.index = part.register;
                continue;
            }
            this.throw();
        }
        return sib;
    }
}
