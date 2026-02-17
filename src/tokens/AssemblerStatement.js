import Token from './Token.js';
import Lexer from '../Lexer.js';
import AssemblerLabel from './AssemblerLabel.js';
import AssemblerOperation from './AssemblerOperation.js';
import AssemblerInstruction from './AssemblerInstruction.js';

const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class AssemblerStatement extends Token {
    tokenize(inputArgs) {
        this.label = this.tokenizeLabel();
        if (this.label !== null) {
            if (this.lexer.eatEnd()) {
                return this.finalize();
            }
            if (this.lexer.wcc().isEmpty()) {
                this.lexer.error();
            }
        }
        this.operation = this.tokenizeOperation(inputArgs);
        this.instruction = this.operation !== null ? null : this.tokenizeInstruction(inputArgs);
        let isOkay = this.operation !== null || this.instruction !== null;
        if (isOkay) {
            if (!this.lexer.eatEnd()) {
                this.lexer.error();
            }
            return this.finalize();
        }
        if (this.label !== null) {
            this.lexer.error();
        }
        return null;
    }

    tokenizeLabel() {
        return new AssemblerLabel(this.lexer).tokenize();
    }

    tokenizeOperation(inputArgs) {
        return new AssemblerOperation(this.lexer).tokenize(inputArgs);
    }

    tokenizeInstruction(inputArgs) {
        return new AssemblerInstruction(this.lexer).tokenize(inputArgs);
    }

    stringify() {
        let {
            label: l = null,
            operation: o = null,
            instruction: i = null,
        } = this;
        let line = (
            (o !== null ? o.stringify() : '')
            + (i !== null ? i.stringify() : '')
        );
        if (l !== null) {
            let space = line !== '' ? ' ' : '';
            line = l.stringify() + space + line;
        }
        return [line];
    }

    toBuffer(arch) {
        let {
            operation: o = null,
            instruction: i = null,
        } = this;
        if (o !== null) {
            let scheme = this.getScheme(arch, o.operation, o.arguments);
            if (scheme === undefined) {
                throw new Error;
            }
            return this.toBufferChild(arch, scheme.alias, o.arguments);
        }
        if (i === null) {
            return [];
        }
        let {instruction, opsize} = i;
        if (opsize === null) {
            let scheme = this.getScheme(arch, instruction, i.arguments);
            if (scheme !== undefined) {
                if (scheme.alias !== undefined) {
                    return this.toBufferChild(arch, scheme.alias, i.arguments);
                }
                return arch.toBuffer(scheme, i.arguments);
            }
        }
        let opsizes = toArray(opsize ?? arch.opsizes);
        let possible = opsizes.map((opsize) => [instruction, opsize].join('.'));
        let schemes = possible.map((instruction) => {
            return this.getScheme(arch, instruction, i.arguments);
        });
        schemes = schemes.filter((scheme) => scheme !== undefined);
        if (schemes.length !== 1) {
            throw new Error;
        }
        let [scheme] = schemes;
        return arch.toBuffer(scheme, i.arguments);
    }

    toBufferChild(arch, ins, myArguments) {
        ins = typeof ins === 'function' ? ins(myArguments) : ins;
        return [].concat(...toArray(ins).map((ins) => {
            let lexer = new Lexer(ins);
            let statement = new AssemblerStatement(lexer).tokenize(myArguments);
            if (statement === null) {
                throw new Error;
            }
            if (!lexer.isEndOfFile()) {
                throw new Error;
            }
            return statement.toBuffer(arch);
        }));
    }

    getScheme(arch, searchKey, asmArgs) {
        let schemes = arch.isa[searchKey];
        [schemes = []] = [schemes];
        return toArray(schemes).find((scheme) => {
            let schemeArgs = scheme.args;
            let len = asmArgs.length;
            if (!isArray(schemeArgs)) {
                return schemeArgs === len;
            }
            if (schemeArgs.length !== len) {
                return false;
            }
            return schemeArgs.every((schemeArg, i) => {
                let resolver = arch.resolver[schemeArg];
                if (resolver === undefined) {
                    return false;
                }
                [resolver] = resolver;
                return resolver(asmArgs[i]);
            });
        });
    }
}
