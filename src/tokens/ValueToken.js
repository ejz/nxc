import Token from './Token.js';

export default class ValueToken extends Token {
    constructor(...args) {
        super(...args);
        this.value = '';
    }

    finalize(value, parents) {
        if (value === null) {
            return super.finalize(null, parents);
        }
        this.value = value;
        return super.finalize([], parents);
    }

    clone() {
        let token = super.clone();
        token.value = this.value;
        return token;
    }

    toString() {
        return this.value;
    }
}

export class StringToken extends ValueToken {
    eat() {
        return this.lexer.eat(this.string);
    }

    get string() {
        return eval(this.name);
    }
}

export class KeywordToken extends ValueToken {
    eat() {
        return this.lexer.eat(this.keyword);
    }

    get keyword() {
        return this.name.slice(1, -1);
    }
}

export class RegexToken extends ValueToken {
    eat() {
        return this.lexer.eatRegex(this.regex);
    }

    get regex() {
        return eval(this.name);
    }
}

export class GreedyToken extends ValueToken {
    eat() {
        return this.lexer.eatCharacter();
    }
}
