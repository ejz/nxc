import Token from './Token.js';
import InternalError from '../errors/InternalError.js';
import AssemblerLabel from './AssemblerLabel.js';

export default class AssemblerArgument extends Token {
    tokenize(inputArgs = null) {
        if (inputArgs !== null) {
            let ref = this.eatRef();
            if (ref !== null) {
                let inputArg = inputArgs[ref];
                if (inputArg === undefined) {
                    throw new InternalError;
                }
                return inputArg;
            }
        }
        this.address = this.eatAddress();
        if (this.address !== null) {
            return this.finalize();
        }
        this.integer = this.eatInteger();
        if (this.integer !== null) {
            return this.finalize();
        }
        this.sib = this.eatSib();
        if (this.sib !== null) {
            return this.finalize();
        }
        this.register = this.eatRegister();
        if (this.register !== null) {
            return this.finalize();
        }
        this.label = this.eatLabel();
        if (this.label !== null) {
            return this.finalize();
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
                    throw this.lexer.error();
                }
            }
            let part = this.eatSibPart();
            if (part === null) {
                throw this.lexer.error();
            }
            part.minus = plusMinus === '-';
            if (part.minus && part.type !== 'integer') {
                throw this.lexer.error();
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
        return AssemblerLabel.prototype.eatLabel.bind(this)();
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
            throw this.lexer.error();
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
            throw this.lexer.error();
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
                throw this.lexer.error();
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
            throw this.lexer.error();
        }
        return sib;
    }

    eatRef() {
        let ref = null;
        this.lexer.try(() => {
            if (!this.lexer.eat('$')) {
                return false;
            }
            ref = this.lexer.eatDecNum();
            return ref !== null;
        });
        return ref;
    }

    static tokenizeArguments(lexer, inputArgs) {
        let collect = [];
        while (true) {
            let argument = new AssemblerArgument(lexer).tokenize(inputArgs);
            if (argument === null) {
                if (collect.length === 0) {
                    break;
                }
                throw lexer.error();
            }
            collect.push(argument);
            if (!lexer.eatSpecialCharacter(' , ')) {
                break;
            }
        }
        return collect;
    }

    static stringifyArguments(collect) {
        let map = (arg) => arg.stringify();
        return collect.map(map).join(', ');
    }
}
