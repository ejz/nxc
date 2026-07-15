import Token from './Token.js';

const isInline = (v) => !v.includes('\r') && !v.includes('\n');

export default class Sep extends Token {
    isInline() {
        return isInline(this.stringify());
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
}

export class InlineSep extends Token {
    static resolve(lexer, grammar) {
        console.log(lexer.tail);
        let sep = grammar.tokenize('Sep', lexer, false);
        console.log({sep});
        console.log(lexer.tail);
        if (sep === null || !sep.isInline()) {
            return null;
        }
        return {sep};
    }

    stringify() {
        return this.sep.stringify();
    }
}
