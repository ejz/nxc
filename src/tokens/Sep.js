import Token from './Token.js';

const isInline = (value) => !value.includes('\r') && !value.includes('\n');

export default class Sep extends Token {
    isInline() {
        return this.choice.isInline();
    }
}

export class Whitespace extends Token {
    isInline() {
        return isInline(this.choice.value);
    }
}

export class Comment extends Token {
    isInline() {
        return this.choice.isInline();
    }
}

export class SinglelineComment extends Token {
    isInline() {
        let [, body] = this.children;
        return body.isInline();
    }
}

export class MultilineComment extends Token {
    isInline() {
        let [, body] = this.children;
        return body.isInline();
    }
}

export class SinglelineCommentBody extends Token {
    static resolve(lexer) {
        let tuple = lexer.eatTill('\r\n', '\r', '\n');
        let [comment, newline = null] = tuple ?? [lexer.eatAll()];
        lexer.proceed((newline ?? '').length);
        return {newline, comment};
    }

    stringify() {
        return this.comment + (this.newline ?? '');
    }

    isInline() {
        return this.newline === null;
    }
}

export class MultilineCommentBody extends Token {
    static resolve(lexer) {
        let tuple = lexer.eatTill('*/');
        let [comment] = tuple ?? [lexer.eatAll()];
        return {comment};
    }

    stringify() {
        return this.comment;
    }

    isInline() {
        return isInline(this.comment);
    }
}

export class InlineSep extends Token {
    static resolve(lexer, grammar) {
        let sep = grammar.tokenize('Sep', lexer);
        if (sep === null || !sep.isInline()) {
            return null;
        }
        return {sep};
    }

    stringify() {
        return this.sep.stringify();
    }
}
