import Token from './Token.js';

const some = (sep) => !sep.isInline();

export default class End extends Token {
    static resolve(lexer, grammar) {
        let res = lexer.look(() => {
            let sep, seps = [];
            while (sep !== null) {
                sep = grammar.tokenize('Sep', lexer);
                seps.push(sep);
            }
            seps.pop();
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
