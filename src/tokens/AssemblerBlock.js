import Token from './Token.js';
import {kw} from '../constants.js';
import AssemblerStatement from './AssemblerStatement.js';
import Lexer from '../Lexer.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

const sumLen = (arr) => arr.reduce((acc, elem) => acc + elem.length, 0);

export default class AssemblerBlock extends Token {
    tokenize() {
        let isOkay = this.lexer.try(() => {
            if (!this.lexer.eat(kw.ASM)) {
                return false;
            }
            return this.lexer.eatSpecialCharacter(' {');
        });
        if (!isOkay) {
            return null;
        }
        this.statements = [];
        this.lexer.whitespaceCommentCollection();
        while (true) {
            let statement = this.tokenizeAssemblerStatement();
            if (statement === null) {
                break;
            }
            this.statements.push(statement);
            this.lexer.whitespaceCommentCollection();
        }
        if (!this.lexer.eat('}')) {
            throw new InvalidTokenError(this.lexer, undefined, '}');
        }
        return this.finalize();
    }

    tokenizeAssemblerStatement() {
        return new AssemblerStatement(this.lexer).tokenize();
    }

    stringify() {
        let lines = [];
        for (let statement of this.statements) {
            lines.push(...statement.stringify());
        }
        return [kw.ASM + ' {', ...Lexer.indent(lines), '}'];
    }

    toBuffer(arch) {
        let labels = Object.create(null);
        let buffers = [];
        for (let statement of this.statements) {
            if (statement.label === undefined) {
                buffers.push(statement.toBuffer(arch));
                continue;
            }
            if (labels[statement.label] !== undefined) {
                throw new Error;
            }
            labels[statement.label] = sumLen(buffers);
        }
        return Buffer.concat(buffers);
    }
}
