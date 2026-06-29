import Token from './Token.js';

export default class SameLineSep extends Token {
    static resolve(token, grammar) {
        let sep = null, lex = token.lexer;
        let res = lex.try(() => {
            sep = grammar.tokenize('Sep*', lex, token);
            return sep !== null && !sep.gotNewline();
        });
        if (!res) {
            return null;
        }
        return token.finalize({sep});
    }

    stringify() {
        return this.sep.stringify();
    }
}
