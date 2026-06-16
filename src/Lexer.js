// import LexerError from './errors/LexerError.js';
// import LexerValidationError from './errors/LexerValidationError.js';
// import WhitespaceCommentCollection from './WhitespaceCommentCollection.js';
// import Comment from './tokens/Comment.js';
// import Whitespace from './tokens/Whitespace.js';
// import Token from './tokens/Token.js';

// const isArray = Array.isArray;
// const isToken = (token) => token instanceof Token;
// const isTokenArray = (array) => isArray(array) && array.every(isToken);
// const isTokenConstructor = (ctor) => (
//     ctor.prototype instanceof Token
//     || ctor === Token
// );
// if (Buffer.isBuffer(input)) {
//     this.validate(input);
//     input = input.toString();
//     input = this.replaceCrLf(input);
// }
// this.backup = this.content;

const identifier = {
    // key: [upperCase, underscore]
    [[true, true]]: /^[_a-zA-Z][_a-zA-Z0-9]*/,
    [[true, false]]: /^[a-zA-Z][a-zA-Z0-9]*/,
    [[false, true]]: /^[_a-z][_a-z0-9]*/,
    [[false, false]]: /^[a-z][a-z0-9]*/,
};

export default class Lexer {
    constructor(content, position = 0) {
        this.content = content;
        this.position = position;
    }

    proceed(shift) {
        this.position += shift;
    }

    isEOF() {
        return this.content.length === this.position;
    }

    eat(string) {
        if (!this.content.startsWith(string, this.position)) {
            return false;
        }
        this.proceed(string.length);
        return true;
    }

    eatTill(...subs) { // todo: handle reorder correctly
        let content = this.content.slice(this.position);
        let pos = Infinity;
        let found = null;
        subs.forEach((sub) => {
            let idx = content.indexOf(sub);
            if (idx === -1) {
                return;
            }
            if (idx < pos) {
                pos = idx;
                found = sub;
            }
        });
        if (found === null) {
            return null;
        }
        this.proceed(pos);
        return [content.slice(0, pos), found];
    }

    eatAll() {
        let content = this.content.slice(this.position);
        this.proceed(content.length);
        return content;
    }

    eatIdentifier({upperCase = false, underscore = false, multiple = null} = {}) {
        let regex = identifier[[upperCase, underscore]];
        let parts = null;
        while (true) {
            let part = null;
            if (parts === null) {
                part = this.eatRegex(regex);
            } else {
                this.try(() => {
                    if (!this.eat(multiple)) {
                        return false;
                    }
                    part = this.eatRegex(regex);
                    return part !== null;
                });
            }
            if (part === null) {
                break;
            }
            parts ??= [];
            parts.push(part);
            if (multiple === null) {
                break;
            }
        }
        if (parts === null) {
            return null;
        }
        return parts.join(multiple ?? '');
    }

    eatRegex(regex) {
        let content = this.content.slice(this.position);
        let match = content.match(regex);
        if (match === null) {
            return null;
        }
        let [m] = match;
        this.proceed(m.length);
        return m;
    }

    try(fn) {
        let position = this.position;
        if (fn()) {
            return true;
        }
        this.position = position;
        return false;
    }

    look(fn) {
        let position = this.position;
        let res = fn();
        this.position = position;
        return res;
    }
}
