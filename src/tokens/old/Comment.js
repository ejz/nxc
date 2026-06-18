import WhitespaceComment from './WhitespaceComment.js';

export default class Comment extends WhitespaceComment {
    constructor(...args) {
        super(...args);
        this.isSingleline = false;
    }

    tokenize() {
        let slc = this.eatSingleline();
        let content = slc ?? this.eatMultiline();
        if (content === null) {
            return null;
        }
        this.content = content;
        this.isSingleline = slc !== null;
        return this.finalize();
    }

    eatSingleline() {
        if (!this.lexer.eat('//')) {
            return null;
        }
        let content = (
            this.lexer.eatTill('\n')
            ?? this.lexer.eatAll()
        );
        return content;
    }

    eatMultiline() {
        let content = null;
        this.lexer.try(() => {
            if (!this.lexer.eat('/*')) {
                return false;
            }
            content = this.lexer.eatTill('*/');
            if (content === null) {
                return false;
            }
            this.lexer.move(2);
            return true;
        });
        return content;
    }
}

