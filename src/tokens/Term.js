import Token from './Token.js';

export default class Term extends Token {
    static resolve(token, grammar) {
        let sep = null, lex = token.lexer;
        let res = lex.try(() => {
            sep = grammar.tokenize('SepOpt', lex);
            return sep.gotNewline() && lex.eat(';');
        });
        sep = res ? sep : null;
        return token.finalize({sep});
    }

    stringify() {
        return this.sep !== null ? this.sep.stringify() + ';' : '';
    }
}
