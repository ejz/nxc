import Token from './Token.js';

export default class AssemblerLabel extends Token {
    tokenize() {
        this.name = null;
        this.lexer.try(() => {
            this.name = this.eat();
            if (this.name === null) {
                return false;
            }
            return this.lexer.eat(':');
        }, () => {
            this.name = null;
        });
        if (this.name === null) {
            return null;
        }
        return this.finalize();
    }

    eat() {
        return this.lexer.eatIdentifier(true);
    }

    stringify() {
        let line = this.name + ':';
        return [line];
    }
}
