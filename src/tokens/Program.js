import Token from './Token.js';
import RegularBlock from './RegularBlock.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

export default class Program extends Token {
    tokenize() {
        this.statements = [];
        this.lexer.whitespaceCommentCollection();
        while (!this.lexer.isEndOfFile()) {
            let statement = this.tokenizeStatement();
            if (statement === null) {
                throw new InvalidTokenError(this.lexer);
            }
            this.statements.push(statement);
            this.lexer.whitespaceCommentCollection();
        }
        return this.finalize();
    }

    tokenizeStatement() {
        return RegularBlock.prototype.tokenizeStatement.bind(this)();
    }

    stringify() {
        let lines = [];
        for (let statement of this.statements) {
            lines.push(...statement.stringify());
        }
        lines.push('');
        return lines.join('\n');
    }
}
