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

    // eatIdentifier({upperCase = false, underscore = false, multiple = null} = {}) {
    //     let regex = identifier[[upperCase, underscore]];
    //     let parts = null;
    //     while (true) {
    //         let part = null;
    //         if (parts === null) {
    //             part = this.eatRegex(regex);
    //         } else {
    //             this.try(() => {
    //                 if (!this.eat(multiple)) {
    //                     return false;
    //                 }
    //                 part = this.eatRegex(regex);
    //                 return part !== null;
    //             });
    //         }
    //         if (part === null) {
    //             break;
    //         }
    //         parts ??= [];
    //         parts.push(part);
    //         if (multiple === null) {
    //             break;
    //         }
    //     }
    //     if (parts === null) {
    //         return null;
    //     }
    //     return parts.join(multiple ?? '');
    // }

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

    // eatDecimalNumber() {
    //     return this.eatRegex(/^(0|[1-9][0-9]*)/);
    // }

    // eatHexadecimalNumber() {
    //     return this.eatRegex(/^0x[0-9a-fA-F]+/);
    // }

    // eatNumber() {
    //     return this.eatHexadecimalNumber() ?? this.eatDecimalNumber();
    // }
}
