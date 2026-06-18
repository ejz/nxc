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
}
