import ValueToken from './ValueToken.js';

export default class KeywordToken extends ValueToken {
    resolve() {
        return this.lexer.eat(this.keyword);
    }

    get keyword() {
        return this.name.slice(1, -1);
    }
}
