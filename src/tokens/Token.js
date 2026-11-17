import Lexer from '../Lexer.js';
import InternalError from '../errors/InternalError.js';

export const Walk = {
    Continue: 1,
    Ignore: 0,
    Stop: -1,
};

const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class Token {
    constructor(name, lexer, grammar) {
        this.name = name;
        this.lexer = lexer;
        this.grammar = grammar;
        this.start = this.lexer.position;
        this.end = null;
        this.parent = null;
        this.children = [];
    }

    toString() {
        return this.children.map((token) => {
            return token.toString();
        }).join('');
    }

    reset() {
        this.lexer.position = this.start;
        this.end = null;
    }

    fix() {
        this.end = this.lexer.position;
    }

    finalize(children, parents) {
        if (children === null) {
            this.reset();
            this.onToken(false, parents);
            return null;
        }
        this.fix();
        this.setChildren(children);
        if (this.validate !== undefined && !this.validate()) {
            this.reset();
            this.onToken(false, parents);
            return null;
        }
        this.onToken(true, parents);
        return this;
    }

    setChildren(children) {
        this.children = toArray(children);
        this.children.forEach((child) => {
            child.parent = this;
        });
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    onToken(isResolved, parents) {
        // let map = (t) => t.name;
        // let delim = ' <- ';
        // console.log(
        //     '(%s) (%s:%s) %s %s%s',
        //     parents.length,
        //     this.start,
        //     this.end ?? '',
        //     isResolved ? '[v]' : '[x]',
        //     parents.map(map).join(delim),
        //     (parents.length === 0 ? '' : delim) + this.name,
        // );
    }

    toTree(pad = ' ') {
        let lines = [];
        lines.push(this.name);
        this.children.forEach((token) => {
            lines.push(...token.toTree(pad).map((line) => {
                return pad + line;
            }));
        });
        return lines;
    }

    filter(filter) {
        if (typeof filter === 'string') {
            let name = filter;
            filter = (token) => token.name === name;
        }
        let collector = [];
        this.walk((token) => {
            let res = filter(token) ?? [];
            res = typeof res === 'boolean' ? [, res] : res;
            res = typeof res === 'number' ? [res] : res;
            let [walk = Walk.Continue, filt = false] = res;
            if (filt) {
                collector.push(token);
            }
            return walk;
        });
        return collector;
    }

    walk(callback) {
        let res = callback(this);
        if ([Walk.Ignore, Walk.Stop].includes(res)) {
            return res;
        }
        for (let child of this.children) {
            let res = child.walk(callback);
            if (res === Walk.Stop) {
                return res;
            }
        }
        return Walk.Continue;
    }

    unwrap() {
        let parent = this.parent;
        if (parent === null) {
            throw new InternalError;
        }
        let plist = parent.children;
        let list = this.children;
        list.forEach((child) => {
            child.parent = parent;
        });
        let idx = plist.indexOf(this);
        if (idx === -1) {
            throw new InternalError;
        }
        plist.splice(idx, 1, ...list);
    }

    remove() {
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
    }

    is(...names) {
        return names.includes(this.name);
    }

    getChild(n = 0) {
        let idx = n < 0 ? this.children.length + n : n;
        let child = this.children[idx];
        if (child === undefined) {
            throw new InternalError;
        }
        return child;
    }

    tokenize(code, name = this.name) {
        let lexer = new Lexer(code);
        let token = this.grammar.tokenize(name, lexer);
        if (token === null || !lexer.isEof()) {
            throw new InternalError;
        }
        token = this.grammar.treeShake(token);
        return token;
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

    clone() {
        let ctor = this.constructor;
        let token = new ctor(this.name, this.lexer, this.grammar);
        token.start = this.start;
        token.end = this.end;
        let children = this.children.map((child) => child.clone());
        token.setChildren(children);
        return token;
    }
}
