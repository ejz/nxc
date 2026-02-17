import Token from './Token.js';
import AssemblerArgument from './AssemblerArgument.js';
import operations from '../arch/operations.js';

export default class AssemblerOperation extends Token {
    tokenize() {
        let isOkay = this.lexer.try(() => {
            let argument = this.tokenizeArgument();
            if (argument === null) {
                return false;
            }
            this.arguments = [argument];
            this.operation = this.eatOperation();
            if (this.operation === null) {
                return false;
            }
            this.arguments.push(...this.tokenizeArguments());
            return true;
        });
        return isOkay ? this.finalize() : null;
    }

    eatOperation() {
        let operation = null;
        this.lexer.try(() => {
            this.lexer.wcc();
            operation = this.lexer.eatOneOf(...operations);
            if (operation === null) {
                return false;
            }
            this.lexer.wcc();
            return true;
        });
        return operation;
    }

    tokenizeArgument() {
        return new AssemblerArgument(this.lexer).tokenize();
    }

    tokenizeArguments() {
        return AssemblerArgument.tokenizeArguments(this.lexer);
    }

    stringify() {
        let [argument, ...rest] = this.arguments;
        let space = rest.length !== 0 ? ' ' : '';
        return (
            argument.stringify()
            + space + this.operation + space
            + AssemblerArgument.stringifyArguments(rest)
        );
    }
}
