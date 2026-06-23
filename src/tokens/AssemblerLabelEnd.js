import Token from './Token.js';

export default class AssemblerLabelEnd extends Token {
    static resolve(token, grammar) {
        let lex = token.lexer;
        let res = lex.look(() => {
            let sep = grammar.tokenize('SepOpt', lex);
            return lex.isEof() || sep.gotNewline() || lex.eat('}');
        });
        if (!res) {
            return null;
        }
        return token.finalize();
    }

    stringify() {
        return '';
    }
}
