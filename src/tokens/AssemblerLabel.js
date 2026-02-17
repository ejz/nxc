import Token from './Token.js';

export default class AssemblerLabel extends Token {
    tokenize() {
        let isOkay = this.lexer.try(() => {
            this.name = this.eat();
            if (this.name === null) {
                return false;
            }
            return this.lexer.eat(':');
        });
        return isOkay ? this.finalize() : null;
    }

    eat() {
        return this.lexer.eatIdentifier({
            upperCase: true,
            underscore: true,
        });
    }

    stringify() {
        return this.name + ':';
    }
}
