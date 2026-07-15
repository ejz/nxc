import Token from './Token.js';

const some = (sep) => !sep.isInline();

export default class End extends Token {
    static resolve(lexer, grammar) {
        let res = lexer.look(() => {
            let sep, seps = [];
            while (sep !== null) {
                sep = grammar.tokenize('Sep', lexer, false);
                seps.push(sep);
            }
            seps.pop();
            console.log({seps}, lexer.isEof(), lexer.tail);
            return lexer.isEof() || lexer.eat('}') || seps.some(some);
        });
        if (!res) {
            return null;
        }
        return {};
    }

    stringify() {
        return '';
    }
}
