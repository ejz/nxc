import Token from './tokens/Token.js';
import LexerError from './errors/LexerError.js';

const isArray = Array.isArray;
const isToken = (token) => token instanceof Token;
const isTokenArray = (array) => isArray(array) && array.every(isToken);

export const LexerWalk = {
    Continue: 1,
    Ignore: 0,
    Stop: -1,
};

export default class Lexer {
    constructor(content, position = 0) {
        this.content = content;
        this.position = position;
    }

    validate() {
        let idx = this.content.indexOf('\uFFFD');
        if (idx !== -1) {
            throw this.error();
        }
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

    static walk(token, cb, list = null) {
        let res = cb(token, list);
        if ([LexerWalk.Ignore, LexerWalk.Stop].includes(res)) {
            return res;
        }
        let children = Lexer.children(token);
        for (let [child, list] of children) {
            let res = Lexer.walk(child, cb, list);
            if (res === LexerWalk.Stop) {
                return res;
            }
        }
    }

    error(opts) {
        return new LexerError(this, opts);
    }

    static children(token) {
        let collect = [];
        for (let key of Object.keys(token)) {
            if (key === 'parent') {
                continue;
            }
            let child = token[key];
            if (isToken(child)) {
                collect.push([child, null]);
                continue;
            }
            if (isTokenArray(child)) {
                for (let element of child) {
                    collect.push([element, child]);
                }
                continue;
            }
        }
        return collect;
    }

    static collect(token, filter) {
        let collector = [];
        Lexer.walk(token, (...args) => {
            let res = filter(...args);
            res ??= [];
            res = typeof res === 'boolean' ? [, res] : res;
            res = typeof res === 'number' ? [res] : res;
            let [walk = LexerWalk.Continue, filt = false] = res;
            if (filt) {
                collector.push(args);
            }
            return walk;
        });
        return collector;
    }
}
