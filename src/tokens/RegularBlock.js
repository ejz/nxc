import Lexer from '../Lexer.js';
import Token from './Token.js';
import EmptyStatement from './EmptyStatement.js';
import AssemblerBlock from './AssemblerBlock.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

export default class RegularBlock extends Token {
    tokenize() {
        if (!this.lexer.eat('{')) {
            return null;
        }
        this.statements = [];
        this.lexer.wcc();
        while (true) {
            let statement = this.tokenizeStatement();
            if (statement === null) {
                break;
            }
            this.statements.push(statement);
            this.lexer.wcc();
        }
        if (!this.lexer.eat('}')) {
            throw new InvalidTokenError(this.lexer, {expected: '}'});
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
            new AssemblerBlock(this.lexer).tokenize()
            ?? new EmptyStatement(this.lexer).tokenize()
            ?? new RegularBlock(this.lexer).tokenize()
        );
    }
}
