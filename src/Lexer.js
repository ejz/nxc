import LexerValidationError from './errors/LexerValidationError.js';
import WhitespaceCommentCollection from './WhitespaceCommentCollection.js';
import Comment from './tokens/Comment.js';
import Whitespace from './tokens/Whitespace.js';
import Token from './tokens/Token.js';

const isArray = Array.isArray;
const isToken = (token) => token instanceof Token;
const isTokenArray = (array) => isArray(array) && array.every(isToken);
const isTokenConstructor = (ctor) => (
    ctor.prototype instanceof Token
    || ctor === Token
);

export default class Lexer {
    constructor(buffer) {
        if (typeof buffer === 'string') {
            buffer = Buffer.from(buffer);
        }
        this.validate(buffer);
        let content = buffer.toString();
        this.content = content;
        this.replaceCrLf();
        this.position = 0;
        this.backup = this.content;
    }

    getState() {
        return {
            lexer: this,
            content: this.content,
            position: this.position,
            revert() {
                this.lexer.content = this.content;
                this.lexer.position = this.position;
            },
        };
    }

    isEndOfFile() {
        return this.content.length === 0;
    }

    move(n) {
        this.content = this.content.slice(n);
        this.position += n;
    }

    try(someFn) {
        let state = this.getState();
        if (someFn()) {
            return true;
        }
        state.revert();
        return false;
    }

    look(someFn) {
        let state = this.getState();
        let res = someFn();
        state.revert();
        return res;
    }

    validate(buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];
            if (byte > 0x7f) {
                throw new LexerValidationError(byte, i);
            }
        }
    }

    replaceCrLf() {
        let [head, ...tails] = this.content.split('\r');
        this.content = head + tails.map((tail) => {
            if (!tail.startsWith('\n')) {
                tail = '\n' + tail;
            }
            return tail;
        }).join('');
    }

    eatRegex(regex) {
        let match = this.content.match(regex);
        if (match === null) {
            return null;
        }
        let [m] = match;
        this.move(m.length);
        return m;
    }

    eat(smth) {
        if (!this.content.startsWith(smth)) {
            return false;
        }
        this.move(smth.length);
        return true;
    }

    eatTill(sub) {
        let content = this.content;
        let pos = content.indexOf(sub);
        if (pos === -1) {
            return null;
        }
        let body = content.slice(0, pos);
        this.move(pos);
        return body;
    }

    eatAll() {
        let content = this.content;
        this.move(content.length);
        return content;
    }

    whitespaceCommentCollection() {
        let whitespaceCommentCollection = new WhitespaceCommentCollection();
        while (true) {
            let token = (
                new Comment(this).tokenize()
                ?? new Whitespace(this).tokenize()
            );
            if (token === null) {
                break;
            }
            whitespaceCommentCollection.push(token);
        }
        return whitespaceCommentCollection;
    }

    eatSpecial(special, whitespaceCommentCollectionAfter = true) {
        return this.try(() => {
            this.whitespaceCommentCollection();
            if (!this.eat(special)) {
                return false;
            }
            if (whitespaceCommentCollectionAfter) {
                this.whitespaceCommentCollection();
            }
            return true;
        });
    }

    eatEnd() {
        return this.try(() => {
            let wcc = this.whitespaceCommentCollection();
            return (
                this.isEndOfFile()
                || this.eat(';')
                || wcc.gotNewline()
                || this.look(() => this.eat('}'))
            );
        });
    }

    static indent(lines, c = 1, tab = ' '.repeat(4)) {
        return lines.map((line) => tab.repeat(c) + line);
    }

    static walk(token, cb, parent = null, list = null) {
        let res = cb(token, parent, list);
        [res = 1] = [res];
        if ([0, -1].includes(res)) {
            return res;
        }
        let children = Lexer.children(token);
        for (let [child, list] of children) {
            let res = Lexer.walk(child, cb, token, list);
            if (res === -1) {
                return res;
            }
        }
    }

    static children(token) {
        let collect = [];
        for (let key of Object.keys(token)) {
            let child = token[key];
            if (isToken(child)) {
                collect.push([child, null, key]);
                continue;
            }
            if (isTokenArray(child)) {
                for (let element of child) {
                    collect.push([element, child, key]);
                }
                continue;
            }
        }
        return collect;
    }

    static find(token, ...ctors) {
        let filter = null;
        if (ctors.length !== 0) {
            [filter] = ctors;
            if (isTokenConstructor(filter)) {
                filter = null;
            } else {
                ctors.shift();
            }
        }
        let collector = [];
        Lexer.walk(token, (...args) => {
            let [token] = args;
            if (!token.is(...ctors)) {
                return;
            }
            if (filter === null) {
                collector.push(args);
                return;
            }
            let res = filter(...args);
            [res = false] = [res];
            if (typeof res !== 'boolean') {
                return res;
            }
            if (res) {
                collector.push(args);
            }
            return;
        });
        return collector;
    }

    static findOne(token, ...ctors) {
        let filter = null;
        if (ctors.length !== 0) {
            [filter] = ctors;
            if (isTokenConstructor(filter)) {
                filter = null;
            } else {
                ctors.shift();
            }
        }
        let one = null;
        Lexer.find(token, (...args) => {
            if (filter === null || filter(...args)) {
                one = args;
                return -1;
            }
        }, ...ctors);
        return one;
    }
}
