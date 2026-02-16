import Token from './Token.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';
import Lexer from '../Lexer.js';
import operations from '../arch/operations.js';

const isArray = Array.isArray;
const withSelf = (obj) => (obj.self = obj, obj);
const toArray = (a) => isArray(a) ? a : [a];

export default class AssemblerStatement extends Token {
    tokenize(args) {
        this.label = this.eatLabelDeclaration();
        if (this.label !== null) {
            if (this.lexer.eatEnd()) {
                return this.finalize();
            }
            let wcc = this.lexer.whitespaceCommentCollection();
            if (wcc.isEmpty()) {
                throw new Error;
            }
        }
        if (this.eatFullOperation(args) || this.eatFullInstruction(args)) {
            if (!this.lexer.eatEnd()) {
                throw new Error;
            }
            return this.finalize();
        }
        if (this.label !== null) {
            throw new Error;
        }
        return null;
    }

    eatLabelDeclaration() {
        let label = null;
        this.lexer.try(() => {
            label = this.eatLabel();
            if (label === null) {
                return false;
            }
            return this.lexer.eat(':');
        }, () => {
            label = null;
        });
        return label;
    }

    eatFullOperation(args) {
        return this.lexer.try(() => {
            let argument = this.eatAssemblerArgument(args);
            if (argument === null) {
                return false;
            }
            this.arguments = [argument];
            this.operation = this.eatOperation();
            if (this.operation === null) {
                return false;
            }
            this.arguments.push(...this.eatAssemblerArguments(args));
            return true;
        }, () => {
            delete this.operation;
            delete this.arguments;
        });
    }

    eatFullInstruction(args) {
        return this.lexer.try(() => {
            this.instruction = this.eatInstruction();
            if (this.instruction === null) {
                return false;
            }
            let wcc = this.lexer.whitespaceCommentCollection();
            this.arguments = this.eatAssemblerArguments(args);
            if (this.arguments.length !== 0 && wcc.isEmpty()) {
                throw new Error;
            }
            return true;
        }, () => {
            delete this.instruction;
            delete this.arguments;
        });
    }

    eatAssemblerArguments(args) {
        let collect = [];
        while (true) {
            let argument = this.eatAssemblerArgument(args);
            if (argument === null) {
                if (collect.length === 0) {
                    return [];
                }
                throw new InvalidTokenError(this.lexer);
            }
            collect.push(argument);
            if (!this.lexer.eatSpecialCharacter(' , ')) {
                return collect;
            }
        }
    }

    eatAssemblerArgument(args = []) {
        let ref = this.eatRef();
        if (ref !== null) {
            let arg = args[ref];
            if (arg === undefined) {
                throw new Error;
            }
            return arg;
        }
        let argument = this.#eatAssemblerArgument();
        return argument !== null ? withSelf(argument) : null;
    }

    #eatAssemblerArgument() {
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

    eatInstruction() {
        let instruction = {
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
            instruction.opsize = this.lexer.eatDecNum();
            if (instruction.opsize === null) {
                throw new Error;
            }
        }
        instruction.base = parts.join('');
        return instruction;
    }

    eatOperation() {
        let operation = null;
        this.lexer.try(() => {
            this.lexer.whitespaceCommentCollection();
            operation = this.lexer.eatOneOf(...operations);
            if (operation === null) {
                return false;
            }
            this.lexer.whitespaceCommentCollection();
            return true;
        });
        return operation;
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
        let line = null;
        if (this.operation !== undefined) {
            line = this.stringifyOperation();
        }
        if (this.instruction !== undefined) {
            line = this.stringifyInstruction();
        }
        if (this.label !== null) {
            line = this.label + ':' + (line !== null ? ' ' + line : '');
        }
        return [line];
    }

    stringifyInstruction() {
        let {base, opsize} = this.instruction;
        let space = this.arguments.length !== 0 ? ' ' : '';
        let map = (a) => this.stringifyArgument(a);
        return (
            base
            + (opsize !== null ? '.' + opsize : '')
            + space
            + this.arguments.map(map).join(', ')
        );
    }

    stringifyOperation() {
        let [argument, ...rest] = this.arguments;
        let space = rest.length !== 0 ? ' ' : '';
        let map = (a) => this.stringifyArgument(a);
        return (
            map(argument)
            + ' ' + this.operation + space
            + rest.map(map).join(', ')
        );
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
        if (this.instruction === undefined) {
            return [];
        }
        let {base, opsize} = this.instruction;
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
        let schemes = possible.map((instruction) => this.getScheme(arch, instruction));
        schemes = schemes.filter((scheme) => scheme !== undefined);
        if (schemes.length !== 1) {
            throw new Error;
        }
        let [scheme] = schemes;
        return arch.toBuffer(scheme, this.arguments);
    }

    toBufferChild(arch, instructions) {
        instructions = typeof instructions === 'function' ? instructions(this.arguments) : instructions;
        return [].concat(...toArray(instructions).map((instruction) => {
            let lexer = new Lexer(instruction);
            let statement = new AssemblerStatement(lexer).tokenize(this.arguments);
            if (statement === null) {
                throw new Error;
            }
            if (!lexer.isEndOfFile()) {
                throw new Error;
            }
            return statement.toBuffer(arch);
        }));
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
