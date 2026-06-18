import Token from './Token.js';

export default class End extends Token {
    static resolve(token, grammar) {
        let lex = token.lexer;
        let sep;
        let res = lex.try(() => {
            sep = grammar.tokenize('SepOpt', lex);
            return (
                lex.isEof()
                || sep.gotNewline()
                || lex.look(() => lex.eat('}'))
            );
        });
        // a:}
        // a: ;}
        // a: a = 1}
        if (!res) {
            return null;
        }
        return token.finalize({sep});
    }

    stringify() {
        return this.sep.stringify();
    }
}
