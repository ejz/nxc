import ValueToken from './ValueToken.js';

export default class RegexToken extends ValueToken {
    eat() {
        return this.lexer.eatRegex(this.regex);
    }

    get regex() {
        return eval(this.name);
    }
}
