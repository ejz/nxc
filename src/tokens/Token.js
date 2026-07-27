import InternalError from '../errors/InternalError.js';

export const Walk = {
    Continue: 1,
    Ignore: 0,
    Stop: -1,
};

export default class Token {
    constructor(name, parent = null) {
        this.name = name;
        this.parent = parent;
    }

    is(...names) {
        return names.includes(this.name);
    }

    getChild(n = 0) {
        let list = this.children ?? [];
        let child = list[n];
        child ??= null;
        if (child === null) {
            throw new InternalError;
        }
        return child;
    }

    toString() {
        if (this.value !== undefined) {
            return this.value;
        }
        return this.children.map((child) => {
            return child.toString();
        }).join('');
    }

    walk(callback) {
        let res = callback(this);
        if ([Walk.Ignore, Walk.Stop].includes(res)) {
            return res;
        }
        let list = this.children ?? [];
        for (let child of list) {
            let res = child.walk(callback);
            if (res === Walk.Stop) {
                return res;
            }
        }
        return Walk.Continue;
    }

    remove(rec = true) {
        let parent = this.parent;
        if (parent === null) {
            throw new InternalError;
        }
        let list = parent.children;
        let idx = list.indexOf(this);
        if (idx === -1) {
            throw new InternalError;
        }
        list.splice(idx, 1);
        if (list.length === 0 && rec) {
            parent.remove();
        }
    }

    filter(filterFn) {
        let collector = [];
        this.walk((token) => {
            let res = filterFn(token) ?? [];
            res = typeof res === 'boolean' ? [, res] : res;
            res = typeof res === 'number' ? [res] : res;
            let [walk = Walk.Continue, filt = false] = res;
            if (filt) {
                collector.push(token);
            }
            return walk;
        });
        return collector;
        // if (typeof filterFn === 'string') {
        //     let names = [];
        //     let predicates = [];
        //     for (let filter of filterFn.split('|')) {
        //         // let idx = filter.indexOf('<');
        //         // names.push(idx !== -1 ? filter.slice(0, idx) : filter);
        //         // predicates.push(idx !== -1 ? toPredicate(filter.slice(idx + 1, -1)) : (() => true));
        //     }
        //     // filterFn = (token) => {
        //     //     // let idx = names.indexOf(token.name);
        //     //     // return idx !== -1 && predicates[idx](token);
        //     // };
        // }
    }

    unwrap() {
        let parent = this.parent;
        if (parent === null) {
            throw new InternalError;
        }
        let list = parent.children;
        let children = this.children;
        children.forEach((child) => {
            child.parent = parent;
        });
        let idx = list.indexOf(this);
        if (idx === -1) {
            throw new InternalError;
        }
        list.splice(idx, 1, ...children);
    }

    replace(token) {
        let parent = this.parent;
        if (parent === null) {
            throw new InternalError;
        }
        token.parent = parent;
        let list = parent.children;
        let idx = list.indexOf(this);
        if (idx === -1) {
            throw new InternalError;
        }
        list.splice(idx, 1, token);
    }

    toTree(pad = ' ') {
        let lines = [];
        lines.push(this.name);
        let list = this.children ?? [];
        list.forEach((token) => {
            lines.push(...token.toTree(pad).map((line) => pad + line));
        });
        return lines;
    }
}
// this.start = start;
// this.lexer = lexer;
// this.end = this.lexer.position;
// if (typeof value === 'string') {
//     this.value = value;
// } else if (isArray(value)) {
//     this.children = value;
// } else {
//     throw new InternalError;
// }
// if (this.validate !== undefined) {
//     this.validate();
// }