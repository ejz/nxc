import Token from './Token.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

const withSelf = (obj) => (obj.self = obj, obj);

export default class AssemblerStatement extends Token {
    tokenize() {
        return (
            this.tokenizeOperation()
            ?? this.tokenizeInstruction()
        );
    }

    tokenizeOperation() {
        return null;
    }

    tokenizeInstruction() {
        this.mnemo = this.eatMnemo();
        if (this.mnemo === null) {
            return null;
        }
        this.arguments = [];
        while (!this.lexer.eatEnd()) {
            if (this.arguments.length === 0) {
                let wcc = this.lexer.whitespaceCommentCollection();
                if (!wcc.notEmpty()) {
                    throw new InvalidTokenError(this.lexer);
                }
            } else if (!this.lexer.eatSpecialCharacter(' , ')) {
                throw new InvalidTokenError(this.lexer);
            }
            let argument = this.tokenizeAssemblerArgument();
            if (argument === null) {
                throw new InvalidTokenError(this.lexer);
            }
            this.arguments.push(withSelf(argument));
        }
        return this.finalize();
    }

    tokenizeAssemblerArgument() {
        let address = this.eatAddress();
        if (address !== null) {
            return {type: 'address', address};
        }
        let integer = this.eatInteger();
        if (integer !== null) {
            return {type: 'integer', integer};
        }
        let sib = this.eatSib();
        if (sib !== null) {
            return {type: 'sib', sib};
        }
        let register = this.eatRegister();
        if (register !== null) {
            return {type: 'register', register};
        }
        return null;
    }

    eatMnemo() {
        return this.lexer.eatRegex(/^([a-zA-Z][a-zA-Z0-9]*)(\.[a-zA-Z][a-zA-Z0-9]*)*(\.\d+)?/);
    }

    eatRegister() {
        return this.lexer.eatIdentifier();
    }

    eatInteger() {
        let integer = null;
        this.lexer.try(() => {
            let sign = this.lexer.eatRegex(/^[+-]/);
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
            let seg = this.eatInteger();
            if (seg === null) {
                return false;
            }
            if (!this.lexer.eat(':')) {
                return false;
            }
            let adr = this.eatInteger();
            if (adr === null) {
                return false;
            }
            address = [seg, adr];
            return true;
        });
        return address;
    }

    eatSib() {
        let sib = null;
        this.lexer.try(() => {
            if (!this.eatSibStart()) {
                return false;
            }
            let parts = [];
            while (parts.length === 0 || !this.eatSibEnd()) {
                let minus = false;
                if (parts.length !== 0) {
                    let plus = this.lexer.eatSpecialCharacter(' + ');
                    minus = !plus ? this.lexer.eatSpecialCharacter(' - ') : false;
                    if (!plus && !minus) {
                        throw new InvalidTokenError(this.lexer);
                    }
                }
                let part = this.eatSibPart();
                if (part === null) {
                    throw new InvalidTokenError(this.lexer);
                }
                part.minus = minus;
                if (part.minus && part.type !== 'integer') {
                    throw new InvalidTokenError(this.lexer);
                }
                parts.push(part);
            }
            sib = parts;
            return true;
        });
        if (sib === null) {
            return null;
        }
        return this.compileSib(sib);
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
        let scale = null;
        this.lexer.try(() => {
            if (!this.lexer.eatSpecialCharacter(' * ')) {
                return false;
            }
            scale = this.lexer.eatDecNum();
            return scale !== null;
        });
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
            throw new Error;
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
                throw new Error;
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
            throw new Error;
        }
        return withSelf(sib);
    }

    stringify() {
        let space = this.arguments.length !== 0 ? ' ' : '';
        let map = (a) => this.stringifyArgument(a);
        let line = this.mnemo + space + this.arguments.map(map).join(', ');
        return [line];
    }

    stringifyArgument({type: t, register: r, integer: i, address: a, sib: s}) {
        switch (t) {
            case 'register':
                return r;
            case 'integer':
                return i;
            case 'address':
                return a.join(':');
            case 'sib': {
                let {scale, index, base, disp, minus} = s;
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
        }
        throw new Error;
    }

    toBuffer(arch) {
        let possible = [this.mnemo];
        if (!/\.\d+$/.test(this.mnemo)) {
            possible = possible.concat(arch.details.opsizes.map((opsize) => {
                return [this.mnemo, opsize].join('.');
            }));
        }
        let schemes = possible.map((mnemo) => this.getScheme(arch, mnemo));
        schemes = schemes.filter((scheme) => scheme !== undefined);
        if (schemes.length !== 1) {
            throw new Error;
        }
        let [scheme] = schemes;
        return arch.toBuffer(scheme, this.arguments);
    }

    getScheme(arch, mnemo) {
        let schemes = arch.mnemo[mnemo];
        [schemes = []] = [schemes];
        return schemes.find((scheme) => {
            if (scheme.args.length !== this.arguments.length) {
                return false;
            }
            return scheme.args.every((schemeArg, i) => {
                let resolver = arch.resolver[schemeArg];
                if (resolver === undefined) {
                    return false;
                }
                [resolver] = resolver;
                return resolver(this.arguments[i]);
            });
        });
    }
}
