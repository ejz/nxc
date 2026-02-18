import Token from './Token.js';
import {kw} from '../constants.js';
import AssemblerStatement from './AssemblerStatement.js';
import Lexer from '../Lexer.js';

export default class AssemblerBlock extends Token {
    tokenize() {
        let isOkay = this.lexer.try(() => {
            return (
                this.lexer.eat(kw.ASM)
                && this.lexer.eatSpecialCharacter(' {')
            );
        });
        if (!isOkay) {
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
        this.lexer.expect('}');
        return this.finalize();
    }

    tokenizeStatement() {
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
                let name = statement.label.name;
                if (labels[name] !== undefined) {
                    throw statement.label.error();
                }
                labels[name] = offset;
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
