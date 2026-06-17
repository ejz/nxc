import Token from './Token.js';

export default class MultilineCommentBody extends Token {
    static resolve(token) {
        let tuple = token.lexer.eatTill('*/');
        let [comment] = tuple ?? [token.lexer.eatAll()];
        return token.finalize({comment});
    }

    stringify() {
        return this.comment;
    }

    gotNewline() {
        return this.comment.includes('\r') || this.comment.includes('\n');
    }
}
