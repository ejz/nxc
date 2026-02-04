import WhitespaceComment from './WhitespaceComment.js';

export default class Whitespace extends WhitespaceComment {
    tokenize() {
        let content = this.eat();
        if (content === null) {
            return null;
        }
        this.content = content;
        return this.finalize();
    }

    eat() {
        return this.lexer.eatRegex(/^[ \t\n]+/);
    }
}

