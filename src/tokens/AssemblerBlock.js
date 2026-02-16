import Token from './Token.js';
import {kw} from '../constants.js';
import AssemblerStatement from './AssemblerStatement.js';
import Lexer from '../Lexer.js';
import InvalidTokenError from '../errors/InvalidTokenError.js';

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
            throw new InvalidTokenError(this.lexer, {expected: '}'});
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
        let chunks = [];
        let offset = 0;
        let callbacks = [];
        for (let statement of this.statements) {
            if (statement.label !== null) {
                if (labels[statement.label] !== undefined) {
                    throw new Error;
                }
                labels[statement.label] = offset;
            }
            statement.toBuffer(arch).forEach((chunk) => {
                let length = chunk.length;
                if (chunk.callback !== undefined) {
                    let chunkOffset = offset;
                    callbacks.push(() => chunk.callback({
                        offset: chunkOffset,
                        length,
                        labels,
                    }));
                }
                chunks.push(chunk);
                offset += length;
            });
        }
        callbacks.forEach((callback) => {
            callback();
        });
        return Buffer.concat(chunks);
    }
}
