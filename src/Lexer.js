import LexerValidationError from './errors/LexerValidationError.js';
import WhitespaceCommentCollection from './WhitespaceCommentCollection.js';
import Comment from './tokens/Comment.js';
import Whitespace from './tokens/Whitespace.js';

export default class Lexer {
    constructor(buffer) {
        this.validate(buffer);
        let content = buffer.toString();
        this.content = content;
        this.replaceCrLf();
        this.position = 0;
        this.backup = this.content;
    }

    getState() {
        return {
            lexer: this,
            content: this.content,
            position: this.position,
            revert() {
                this.lexer.content = this.content;
                this.lexer.position = this.position;
            },
        };
    }

    isEndOfFile() {
        return this.content.length === 0;
    }

    move(n) {
        this.content = this.content.slice(n);
        this.position += n;
    }

    try(someFn) {
        let state = this.getState();
        if (someFn()) {
            return true;
        }
        state.revert();
        return false;
    }

    look(someFn) {
        let state = this.getState();
        let res = someFn();
        state.revert();
        return res;
    }

    validate(buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];
            if (byte > 0x7f) {
                throw new LexerValidationError(byte, i);
            }
        }
    }

    replaceCrLf() {
        let [head, ...tails] = this.content.split('\r');
        this.content = head + tails.map((tail) => {
            if (!tail.startsWith('\n')) {
                tail = '\n' + tail;
            }
            return tail;
        }).join('');
    }

    eatRegex(regex) {
        let match = this.content.match(regex);
        if (match === null) {
            return null;
        }
        let [m] = match;
        this.move(m.length);
        return m;
    }

    eat(smth) {
        if (!this.content.startsWith(smth)) {
            return false;
        }
        this.move(smth.length);
        return true;
    }

    eatTill(sub) {
        let content = this.content;
        let pos = content.indexOf(sub);
        if (pos === -1) {
            return null;
        }
        let body = content.slice(0, pos);
        this.move(pos);
        return body;
    }

    eatAll() {
        let content = this.content;
        this.move(content.length);
        return content;
    }

    whitespaceCommentCollection() {
        let whitespaceCommentCollection = new WhitespaceCommentCollection();
        while (true) {
            let token = (
                new Comment(this).tokenize()
                ?? new Whitespace(this).tokenize()
            );
            if (token === null) {
                break;
            }
            whitespaceCommentCollection.push(token);
        }
        return whitespaceCommentCollection;
    }

    static indent(lines, c = 1, tab = ' '.repeat(4)) {
        return lines.map((line) => tab.repeat(c) + line);
    }
}
