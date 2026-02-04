import Lexer from '../Lexer.js';
import Token from './Token.js';
import EmptyStatement from './EmptyStatement.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

export default class RegularBlock extends Token {
    tokenize() {
        if (!this.lexer.eat('{')) {
            return null;
        }
        this.statements = [];
        this.lexer.whitespaceCommentCollection();
        while (true) {
            let statement = this.tokenizeStatement();
            if (statement === null) {
                break;
            }
            this.statements.push(statement);
            this.lexer.whitespaceCommentCollection();
        }
        if (!this.lexer.eat('}')) {
            throw new InvalidTokenError(this.lexer);
        }
        return this.finalize();
    }

    stringify() {
        let lines = [];
        for (let statement of this.statements) {
            lines.push(...statement.stringify());
        }
        return ['{', ...Lexer.indent(lines), '}'];
    }

    tokenizeStatement() {
        return (
            new EmptyStatement(this.lexer).tokenize()
            ?? new RegularBlock(this.lexer).tokenize()
        );
    }
}
