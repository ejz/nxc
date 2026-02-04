import LexerValidationError from './errors/LexerValidationError.js';

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

    move() {
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
}
