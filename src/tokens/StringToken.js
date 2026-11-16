import ValueToken from './ValueToken.js';

export default class StringToken extends ValueToken {
    eat() {
        return this.lexer.eat(this.string);
    }

    get string() {
        return eval(this.name);
    }
}
