import LexerError from './errors/LexerError.js';

export default class Lexer {
    constructor(content, position = 0) {
        this.content = content;
        this.position = position;
    }

    get tail() {
        return this.content.slice(this.position);
    }

    proceed(shift) {
        this.position += shift;
    }

    isEof() {
        return this.content.length === this.position;
    }

    eat(str) {
        let tail = this.tail;
        if (!tail.startsWith(str)) {
            return null;
        }
        this.proceed(str.length);
        return str;
    }

    eatAll() {
        let tail = this.tail;
        this.proceed(tail.length);
        return tail;
    }

    eatAny(...strs) {
        let find = (str) => this.eat(str) !== null;
        return strs.find(find) ?? null;
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

    eatTill(...strs) {
        let tail = this.tail;
        let pos = Infinity;
        let found = null;
        strs.forEach((str) => {
            let idx = tail.indexOf(str);
            if (idx === -1) {
                return;
            }
            if (idx < pos) {
                pos = idx;
                found = str;
            }
        });
        if (found === null) {
            return null;
        }
        this.proceed(pos);
        return [tail.slice(0, pos), found];
    }

    eatRegex(regex) {
        let tail = this.tail;
        let match = tail.match(regex);
        if (match === null) {
            return null;
        }
        let [m] = match;
        this.proceed(m.length);
        return m;
    }

    error(opts) {
        return new LexerError(this, opts);
    }

    getContext(count) {
        let {position, content} = this;
        let lines = content.split(/(\r\n|\r|\n)/);
        let idx = null;
        let pos = null;
        let cursor = 0;
        let clines = [];
        for (let i = 0; i < lines.length; i += 2) {
            let line = lines[i];
            let end = lines[i + 1] ?? '';
            clines.push(line);
            let l = line.length;
            let ex = cursor;
            cursor += l + end.length;
            if (position <= cursor) {
                pos = position - ex;
                idx = i / 2;
                break;
            }
        }
        let from = Math.max(idx - count, 0);
        let to = Math.min(clines.length - 1, idx + count);
        clines = clines.slice(from, to + 1);
        return {lines: clines, shift: from, ptr: idx - from, idx, pos};
    }
}
