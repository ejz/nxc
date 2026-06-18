import Token from './Token.js';
import AssemblerArgument from './AssemblerArgument.js';

export default class AssemblerInstruction extends Token {
    tokenize(inputArgs) {
        let isOkay = this.lexer.try(() => {
            this.instruction = this.eatInstruction();
            if (this.instruction === null) {
                return false;
            }
            this.opsize = this.eatOperandSize();
            let position = this.position;
            let wcc = this.lexer.wcc();
            this.arguments = this.tokenizeArguments(inputArgs);
            if (this.arguments.length !== 0 && wcc.isEmpty()) {
                throw this.lexer.error(position);
            }
            return true;
        });
        return isOkay ? this.finalize() : null;
    }

    tokenizeArguments(inputArgs) {
        return AssemblerArgument.tokenizeArguments(this.lexer, inputArgs);
    }

    eatInstruction() {
        return this.lexer.eatIdentifier({upperCase: true, multiple: '.'});
    }

    eatOperandSize() {
        let opsize = null;
        this.lexer.try(() => {
            if (!this.lexer.eat('.')) {
                return false;
            }
            opsize = this.lexer.eatDecNum();
            return opsize !== null;
        });
        return opsize;
    }

    stringify() {
        let {instruction, opsize} = this;
        let space = this.arguments.length !== 0 ? ' ' : '';
        return (
            instruction
            + (opsize !== null ? '.' + opsize : '')
            + space
            + AssemblerArgument.stringifyArguments(this.arguments)
        );
    }
}
