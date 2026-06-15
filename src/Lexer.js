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
// const identifier = {
//     // key: [upperCase, underscore]
//     [[true, true]]: /^[_a-zA-Z][_a-zA-Z0-9]*/,
//     [[true, false]]: /^[a-zA-Z][a-zA-Z0-9]*/,
//     [[false, true]]: /^[_a-z][_a-z0-9]*/,
//     [[false, false]]: /^[a-z][a-z0-9]*/,
// };
// if (Buffer.isBuffer(input)) {
//     this.validate(input);
//     input = input.toString();
//     input = this.replaceCrLf(input);
// }
// this.backup = this.content;

export default class Lexer {
    constructor(content, position = 0) {
        this.content = content;
        this.position = position;
    }

    proceed(shift) {
        this.position += shift;
    }

    // getState() {
    //     return {
    //         lexer: this,
    //         content: this.content,
    //         position: this.position,
    //         revert() {
    //             this.lexer.content = this.content;
    //             this.lexer.position = this.position;
    //         },
    //     };
    // }

    // isEOF() {
    //     return this.content.length === this.position;
    // }

    // eatChar(char) {
    //     if (this.content[this.position] === char) {
    //         return this.proceed();
    //     }
    //     return false;
    // }

    eat(string) {
        if (!this.content.startsWith(string, this.position)) {
            return false;
        }
        this.proceed(string.length);
        return true;
    }

    eatTill(...subs) {
        let tail = this.content.slice(this.position);
        let pos = Infinity;
        let found = null;
        subs.forEach((sub) => {
            let idx = tail.indexOf(sub);
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
        return [tail.slice(0, pos), found];
    }

    eatAll() {
        let tail = this.content.slice(this.position);
        this.proceed(tail.length);
        return tail;
    }
}
