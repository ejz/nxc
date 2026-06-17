import Token from './Token.js';

export default class MultilineCommentBody extends Token {
    static resolve(token) {
        let tuple = token.lexer.eatTill('*/');
        let [comment = null, newline] = tuple ?? [];
        if (comment === null) {
            return null;
        }
        token.lexer.proceed(newline.length);
        return token.finalize({comment});
    }
}

(token) => {
    let tuple = token.lexer.eatTill(CR, LF, CRLF);
    let [comment, newline = null] = tuple ?? [token.lexer.eatAll()];
    token.lexer.proceed((newline ?? '').length);
    return token.finalize({newline, comment});
};
