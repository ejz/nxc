import Token from './Token.js';

export default class StandaloneAssemblerLabelEnd extends Token {
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
        if (!res) {
            return null;
        }
        return token.finalize({sep});
    }

    stringify() {
        return this.sep.stringify();
    }
}
