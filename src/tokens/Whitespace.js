import WhitespaceComment from './WhitespaceComment.js';

export default class Whitespace extends WhitespaceComment {
    tokenize() {
        let content = this.eatWhitespace();
        if (content === null) {
            return null;
        }
        this.content = content;
        return this.finalize();
    }

    eatWhitespace() {
        return this.lexer.eatWhitespace();
    }
}

