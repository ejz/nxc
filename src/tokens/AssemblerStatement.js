import Token from './Token.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

export default class AssemblerStatement extends Token {
    tokenize() {
        this.mnemo = this.eatMnemo();
        this.arguments = [];
        while (!this.lexer.eatEnd()) {
            if (this.arguments.length === 0) {
                let wcc = this.lexer.whitespaceCommentCollection();
                if (!wcc.notEmpty()) {
                    throw new InvalidTokenError(this.lexer);
                }
            } else if (!this.lexer.eatSpecial(',')) {
                throw new InvalidTokenError(this.lexer);
            }
            let argument = this.tokenizeAssemblerArgument();
            if (argument === null) {
                throw new InvalidTokenError(this.lexer);
            }
            this.arguments.push(argument);
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
        let effective = this.eatEffective();
        if (effective !== null) {
            return {type: 'effective', effective};
        }
        let register = this.eatRegister();
        if (register !== null) {
            return {type: 'register', register};
        }
        return null;
    }

    eatMnemo() {
        return this.lexer.eatRegex(/^[a-zA-Z][a-zA-Z0-9]*/);
    }

    eatRegister() {
        return this.lexer.eatRegex(/^[a-z][a-z0-9]*/);
    }

    eatInteger(allowMinus = true) {
        let integer = this.lexer.eatRegex(/^[+-]?\s*(0x[0-9a-fA-F]+|0|[1-9][0-9]*)/);
        if (integer === null) {
            return null;
        }
        integer = integer.replace(/\s+/g, '');
        if (integer.startsWith('+')) {
            integer = integer.slice(1);
        }
        return integer;
    }

    eatAddress() {
        let address = null;
        this.lexer.try(() => {
            let ptr = this.eatPtr();
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
            address = {
                ptr,
                segment: seg,
                address: adr,
            };
            return true;
        });
        return address;
    }

    eatEffective() {
        let effective = null;
        this.lexer.try(() => {
            let ptr = this.eatPtr();
            let sib = this.eatSib();
            if (sib === null) {
                return false;
            }
            effective = {ptr, ...sib};
            return true;
        });
        return effective;
    }

    eatPtr() {
        let ptr = this.lexer.eatRegex(/^[a-zA-Z][a-zA-Z0-9]*[ \t]+[pP][tT][rR][ \t]+/);
        if (ptr === null) {
            return null;
        }
        return ptr.split(/\s+/).shift().toLowerCase();
    }

    eatSib() {
        let sib = null;
        this.lexer.try(() => {
            if (!this.eatSibStart()) {
                return false;
            }
            let parts = [];
            while (parts.length === 0 || !this.eatSibEnd()) {
                let plusMinus = this.lexer.eatRegex(/^[ \t]*[+-][ \t]*/);
                if (parts.length !== 0 && plusMinus === null) {
                    throw new InvalidTokenError(this.lexer);
                }
                let part = this.eatSibPart();
                if (part === null) {
                    throw new InvalidTokenError(this.lexer);
                }
                if ((plusMinus ?? '').trim() === '-') {
                    if (part.type !== 'integer') {
                        throw new InvalidTokenError(this.lexer);
                    }
                    if (part.integer.startsWith('-')) {
                        part.integer = part.integer.slice(1);
                    } else {
                        part.integer = '-' + part.integer;
                    }
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
        return this.lexer.eatRegex(/^\[[ \t]*/) !== null;
    }

    eatSibEnd() {
        return this.lexer.eatRegex(/^[ \t]*\]/) !== null;
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
        let scale = this.lexer.eatRegex(/^[ \t]*\*[ \t]*(1|2|4|8)[ \t]*/);
        if (scale !== null) {
            scale = +scale.match(/\d+/).shift();
        }
        return {type: 'register', register, scale};
    }

    compileSib(parts) {
        let sib = {scale: 1, base: null, index: null, displacement: '0'};
        for (let part of parts) {
            if (part.type === 'integer') {
                sib.displacement = part.integer;
                continue;
            }
            if (part.type !== 'register') {
                throw new Error('unknown case');
            }
            if (part.scale !== null) {
                sib.scale = part.scale;
                sib.index = part.register;
            } else if (sib.base === null) {
                sib.base = part.register;
            } else {
                sib.index = part.register;
            }
        }
        return sib;
    }

    stringify() {
        let line = this.mnemo.toLowerCase() + (this.arguments.length !== 0 ? ' ' : '') + this.arguments.map((argument) => {
            if (argument.type === 'register') {
                return argument.register;
            }
            if (argument.type === 'integer') {
                return argument.integer.toLowerCase();
            }
            if (argument.type === 'address') {
                let {ptr, segment, address} = argument.address;
                ptr = ptr === null ? '' : ptr.toLowerCase() + ' ptr ';
                return ptr + [segment.toLowerCase(), address.toLowerCase()].join(':');
            }
            if (argument.type === 'effective') {
                let {ptr, scale, index, base, displacement} = argument.effective;
                ptr = ptr === null ? '' : ptr.toLowerCase() + ' ptr ';
                let disp = parseInt(displacement);
                return ptr + '[' + [
                    base === null ? null : base,
                    index === null ? null : (index + ' * ' + scale),
                    disp !== 0 ? displacement.toLowerCase() : null,
                ].filter((p) => p !== null).join(' + ').replace(' + -', ' - ') + ']';
            }
            throw new Error('unknown case');
        }).join(', ');
        return [line];
    }
}
