import Token from './Token.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';
import Lexer from '../Lexer.js';

const isArray = Array.isArray;
const withSelf = (obj) => (obj.self = obj, obj);
const toArray = (a) => isArray(a) ? a : [a];

export default class AssemblerStatement extends Token {
    tokenize(args) {
        return (
            (args === undefined ? this.tokenizeLabel() : null)
            ?? this.tokenizeOperation(args)
            ?? this.tokenizeInstruction(args)
        );
    }

    tokenizeLabel() {
        let isOkay = this.lexer.try(() => {
            this.label = this.eatLabel();
            if (this.label === null) {
                return false;
            }
            return (
                this.lexer.eat(':')
                && this.lexer.eatEnd()
            );
        });
        if (isOkay) {
            return this.finalize();
        }
        delete this.label;
        return null;
    }

    tokenizeOperation(args) {
        let isOkay = this.lexer.try(() => {
            let argument = this.tokenizeAssemblerArgument(args);
            if (argument === null) {
                return false;
            }
            this.arguments = [argument];
            this.operation = this.eatOperation();
            if (this.operation === null) {
                return false;
            }
            argument = this.tokenizeAssemblerArgument(args);
            if (argument === null) {
                return false;
            }
            this.arguments.push(argument);
            return this.lexer.eatEnd();
        });
        if (isOkay) {
            return this.finalize();
        }
        delete this.arguments;
        delete this.operation;
        return null;
    }

    tokenizeInstruction(args) {
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
            let argument = this.tokenizeAssemblerArgument(args);
            if (argument === null) {
                throw new InvalidTokenError(this.lexer);
            }
            this.arguments.push(argument);
        }
        return this.finalize();
    }

    tokenizeAssemblerArgument(args = []) {
        let ref = this.eatRef();
        if (ref !== null) {
            let arg = args[ref];
            if (arg === undefined) {
                throw new Error;
            }
            return arg;
        }
        let argument = this.#tokenizeAssemblerArgument();
        return argument !== null ? withSelf(argument) : null;
    }

    #tokenizeAssemblerArgument() {
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
        let label = this.eatLabel();
        if (label !== null) {
            return {type: 'label', label};
        }
        return null;
    }

    eatLabel() {
        return this.lexer.eatIdentifier(true);
    }

    eatMnemo() {
        let mnemo = {
            base: null,
            opsize: null,
        };
        let parts = [];
        while (true) {
            let identifier = this.lexer.eatIdentifier(true);
            if (identifier === null) {
                break;
            }
            parts.push(identifier);
            if (!this.lexer.eat('.')) {
                break;
            }
            parts.push('.');
        }
        if (parts.length === 0) {
            return null;
        }
        if (parts.at(-1) === '.') {
            parts.pop();
            mnemo.opsize = this.lexer.eatDecNum();
            if (mnemo.opsize === null) {
                throw new Error;
            }
        }
        mnemo.base = parts.join('');
        return mnemo;
    }

    eatOperation() {
        if (this.lexer.eatSpecialCharacter(' = ')) {
            return '=';
        }
        return null;
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
        let line = (
            this.mnemo.base
            + (this.mnemo.opsize !== null ? '.' + this.mnemo.opsize : '')
            + space
            + this.arguments.map(map).join(', ')
        );
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
        let operation = this.getScheme(arch, this.operation);
        if (operation !== undefined) {
            return this.toBufferChild(arch, operation.alias);
        }
        let {base, opsize} = this.mnemo;
        if (opsize === null) {
            let scheme = this.getScheme(arch, base);
            if (scheme !== undefined) {
                if (scheme.alias !== undefined) {
                    return this.toBufferChild(arch, scheme.alias);
                }
                return arch.toBuffer(scheme, this.arguments);
            }
        }
        let opsizes = toArray(opsize ?? arch.opsizes);
        let possible = opsizes.map((opsize) => [base, opsize].join('.'));
        let schemes = possible.map((mnemo) => this.getScheme(arch, mnemo));
        schemes = schemes.filter((scheme) => scheme !== undefined);
        if (schemes.length !== 1) {
            throw new Error;
        }
        let [scheme] = schemes;
        return arch.toBuffer(scheme, this.arguments);
    }

    toBufferChild(arch, instructions) {
        instructions = typeof instructions === 'function' ? instructions(this.arguments) : instructions;
        let buffers = toArray(instructions).map((instruction) => {
            let lexer = new Lexer(instruction);
            let statement = new AssemblerStatement(lexer).tokenize(this.arguments);
            if (statement === null) {
                throw new Error;
            }
            if (!lexer.isEndOfFile()) {
                throw new Error;
            }
            return statement.toBuffer(arch);
        });
        return Buffer.concat(buffers);
    }

    getScheme(arch, isaKey = null) {
        if (isaKey === null) {
            return undefined;
        }
        let schemes = arch.isa[isaKey];
        [schemes = []] = [schemes];
        return toArray(schemes).find((scheme) => {
            let len = this.arguments.length;
            if (!isArray(scheme.args)) {
                return scheme.args === len;
            }
            if (scheme.args.length !== len) {
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
