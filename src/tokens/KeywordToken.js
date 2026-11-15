import ValueToken from './ValueToken.js';

export default class KeywordToken extends ValueToken {
    resolve() {
        if (!this.lexer.eat(this.keyword)) {
            return null;
        }
        return this.finalize();
    }

    get keyword() {
        return this.name.slice(1, -1);
    }

    toString() {
        return this.keyword;
    }

    // finalize(value) {
    //     
    //     this.finalizeValue = value;
    // }

    // get finalizeValue() {
    //     return this._finalizeValue;
    // }

    // set finalizeValue(finalizeValue) {
    //     let ref = this._finalizeValue = finalizeValue;
    //     if (this.isLeaf) {
    //         this.value = ref;
    //     } else {
    //         this.children = ref;
    //     }
    // }

    // get children() {
    //     return this._children ?? [];
    // }

    // set children(children) {
    //     this._children = children;
    //     this._children.forEach((child) => {
    //         child.parent = this;
    //     });
    // }

    // get isLeaf() {
    //     return !isArray(this.finalizeValue);
    // }

    

    // // clone() {
    // //     let ctor = this.constructor;
    // //     let token = new ctor(this.name, this.lexer, this.grammar);
    // //     token.start = this.start;
    // //     let finalizeValue = this.finalizeValue;
    // //     if (!this.isLeaf) {
    // //         finalizeValue = finalizeValue.map((token) => {
    // //             return token.clone();
    // //         });
    // //     }
    // //     token.finalize(finalizeValue);
    // //     token.end = this.end;
    // //     return token;
    // // }

    // // is(...names) {
    // //     return names.includes(this.name);
    // // }

    // // getChild(n = 0) {
    // //     let child = this.children[n];
    // //     if (child === undefined) {
    // //         throw new InternalError;
    // //     }
    // //     return child;
    // // }

    

    // walk(callback) {
    //     let res = callback(this);
    //     if ([Walk.Ignore, Walk.Stop].includes(res)) {
    //         return res;
    //     }
    //     for (let child of this.children) {
    //         let res = child.walk(callback);
    //         if (res === Walk.Stop) {
    //             return res;
    //         }
    //     }
    //     return Walk.Continue;
    // }

    // remove() {
    //     let parent = this.parent;
    //     if (parent === null) {
    //         throw new InternalError;
    //     }
    //     let list = parent.children;
    //     let idx = list.indexOf(this);
    //     if (idx === -1) {
    //         throw new InternalError;
    //     }
    //     list.splice(idx, 1);
    // }

    // filter(filterFn) {
    //     if (typeof filterFn === 'string') {
    //         let names = filterFn.split('|');
    //         filterFn = (token) => names.includes(token.name);
    //     }
    //     let collector = [];
    //     this.walk((token) => {
    //         let res = filterFn(token) ?? [];
    //         res = typeof res === 'boolean' ? [, res] : res;
    //         res = typeof res === 'number' ? [res] : res;
    //         let [walk = Walk.Continue, filt = false] = res;
    //         if (filt) {
    //             collector.push(token);
    //         }
    //         return walk;
    //     });
    //     return collector;
    // }

    // unwrap() {
    //     let parent = this.parent;
    //     if (parent === null) {
    //         throw new InternalError;
    //     }
    //     let plist = parent.children;
    //     let list = this.children;
    //     list.forEach((child) => {
    //         child.parent = parent;
    //     });
    //     let idx = plist.indexOf(this);
    //     if (idx === -1) {
    //         throw new InternalError;
    //     }
    //     plist.splice(idx, 1, ...list);
    // }

    // replace(token) {
    //     let parent = this.parent;
    //     if (parent === null) {
    //         throw new InternalError;
    //     }
    //     token.parent = parent;
    //     let list = parent.children;
    //     let idx = list.indexOf(this);
    //     if (idx === -1) {
    //         throw new InternalError;
    //     }
    //     list.splice(idx, 1, token);
    // }

    // // toTree(pad = ' ') {
    // //     let lines = [];
    // //     lines.push(this.name);
    // //     let list = this.children;
    // //     list.forEach((token) => {
    // //         lines.push(...token.toTree(pad).map((line) => {
    // //             return pad + line;
    // //         }));
    // //     });
    // //     return lines;
    // // }

    // tokenize(code, name = this.name) {
    //     let lexer = new Lexer(code);
    //     let token = this.grammar.tokenize(name, lexer);
    //     if (token === null || !lexer.isEof()) {
    //         throw new InternalError;
    //     }
    //     return token;
    // }
}
