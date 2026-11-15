import ValueToken from './ValueToken.js';

export default class StringToken extends ValueToken {
    resolve() {
        return this.lexer.eat(this.string);
    }

    get string() {
        return eval(this.name);
    }
}
