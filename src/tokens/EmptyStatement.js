import Token from './Token.js';

export default class EmptyStatement extends Token {
    tokenize() {
        if (!this.lexer.eat(';')) {
            return null;
        }
        return this.finalize();
    }

    stringify() {
        let line = ';';
        return [line];
    }
}

