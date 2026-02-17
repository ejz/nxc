import InvalidTokenError from '../errors/InvalidTokenError.js';

export default class Token {
    constructor(lexer) {
        this.lexer = lexer;
        this.start = this.position;
        this.end = this.position;
    }

    get position() {
        return this.lexer.position;
    }

    finalize() {
        this.end = this.position;
        return this;
    }

    is(...ctors) {
        return ctors.some((ctor) => this instanceof ctor);
    }

    fixStart(token) {
        this.start = token.start;
    }
}
