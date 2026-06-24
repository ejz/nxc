import Token from './tokens/Token.js';

const isArray = Array.isArray;
const isToken = (token) => token instanceof Token;
const isTokenArray = (array) => isArray(array) && array.every(isToken);
const isTokenConstructor = (ctor) => ctor.prototype instanceof Token || ctor === Token;

export default class Lexer {
    constructor(content, position = 0) {
        this.content = content;
        this.position = position;
    }

    proceed(shift) {
        this.position += shift;
    }

    isEof() {
        return this.content.length === this.position;
    }

    eat(string) {
        if (!this.content.startsWith(string, this.position)) {
            return false;
        }
        this.proceed(string.length);
        return true;
    }

    eatAll() {
        let content = this.content.slice(this.position);
        this.proceed(content.length);
        return content;
    }

    eatOneOf(...many) {
        let eat = this.eat.bind(this);
        return many.find(eat) ?? null;
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

    eatTill(...subs) {
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
