// import TokenError from '../errors/TokenError.js';

export default class Token {
    constructor(name, lexer) {
        this.name = name;
        this.lexer = lexer;
        this.start = this.position;
        this.end = null;
    }

    finalize({position = this.position, ...rest} = {}) {
        this.end = position;
        Object.assign(this, rest);
        return this;
    }

    get position() {
        return this.lexer.position;
    }

    get content() {
        return this.lexer.content.slice(this.start, this.end ?? this.start);
    }

    // get position() {
    //     return ;
    // }
    // is(...ctors) {
    //     return ctors.some((ctor) => this instanceof ctor);
    // }

    // fixStart(token) {
    //     this.start = token.start;
    // }

    // error(nxcError) {
    //     return new TokenError(this, {nxcError});
    // }
}
