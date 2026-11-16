export default class Token {
    constructor(lexer, name) {
        this.lexer = lexer;
        this.name = name;
        this.start = this.lexer.position;
        this.end = null;
    }

    finalize(isResolved, parents) {
        if (!isResolved) {
            this.lexer.position = this.start;
            this.onToken(false, parents);
            return null;
        }
        this.end = this.lexer.position;
        this.onToken(true, parents);
        return this;
    }

    onToken(isResolved, parents = null) {
        if (parents === null) {
            return;
        }
        let map = (t) => t.name;
        let delim = ' <- ';
        console.log(
            '(%s) (pos = %s) %s %s%s',
            parents.length,
            this.start,
            isResolved ? '[v]' : '[x]',
            parents.map(map).join(delim),
            (parents.length === 0 ? '' : delim) + this.name,
        );
    }
}

// import Lexer from '../Lexer.js';
// import InternalError from '../errors/InternalError.js';

// export const Walk = {
//     Continue: 1,
//     Ignore: 0,
//     Stop: -1,
// };

// const isArray = Array.isArray;

// this.onToken(childToken !== null, token, parents);

    // constructor(name, lexer, grammar) {
    //     this.name = name;
    //     this.lexer = lexer;
    //     this.grammar = grammar;
    //     
    //     this.start = this.lexer.position;
    //     this.end = null;
    // }

    // finalize(value) {
    //     this.end = this.lexer.position;
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

    // toString() {
    //     if (this.isLeaf) {
    //         return this.value;
    //     }
    //     return this.children.map((child) => {
    //         return child.toString();
    //     }).join('');
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

// console.log({isResolved, parents});
// import Lexer from '../Lexer.js';
// import InternalError from '../errors/InternalError.js';

// export const Walk = {
//     Continue: 1,
//     Ignore: 0,
//     Stop: -1,
// };

// const isArray = Array.isArray;

// export default class Token {
//     constructor(name, lexer, grammar) {
//         this.name = name;
//         this.lexer = lexer;
//         this.grammar = grammar;
//         this.parent = null;
//         this.start = this.lexer.position;
//         this.end = null;
//     }

//     finalize(value) {
//         this.end = this.lexer.position;
//         this.finalizeValue = value;
//     }

//     get finalizeValue() {
//         return this._finalizeValue;
//     }

//     set finalizeValue(finalizeValue) {
//         let ref = this._finalizeValue = finalizeValue;
//         if (this.isLeaf) {
//             this.value = ref;
//         } else {
//             this.children = ref;
//         }
//     }

//     get children() {
//         return this._children ?? [];
//     }

//     set children(children) {
//         this._children = children;
//         this._children.forEach((child) => {
//             child.parent = this;
//         });
//     }

//     get isLeaf() {
//         return !isArray(this.finalizeValue);
//     }

//     toString() {
//         if (this.isLeaf) {
//             return this.value;
//         }
//         return this.children.map((child) => {
//             return child.toString();
//         }).join('');
//     }

//     // clone() {
//     //     let ctor = this.constructor;
//     //     let token = new ctor(this.name, this.lexer, this.grammar);
//     //     token.start = this.start;
//     //     let finalizeValue = this.finalizeValue;
//     //     if (!this.isLeaf) {
//     //         finalizeValue = finalizeValue.map((token) => {
//     //             return token.clone();
//     //         });
//     //     }
//     //     token.finalize(finalizeValue);
//     //     token.end = this.end;
//     //     return token;
//     // }

//     // is(...names) {
//     //     return names.includes(this.name);
//     // }

//     // getChild(n = 0) {
//     //     let child = this.children[n];
//     //     if (child === undefined) {
//     //         throw new InternalError;
//     //     }
//     //     return child;
//     // }

    

//     walk(callback) {
//         let res = callback(this);
//         if ([Walk.Ignore, Walk.Stop].includes(res)) {
//             return res;
//         }
//         for (let child of this.children) {
//             let res = child.walk(callback);
//             if (res === Walk.Stop) {
//                 return res;
//             }
//         }
//         return Walk.Continue;
//     }

//     remove() {
//         let parent = this.parent;
//         if (parent === null) {
//             throw new InternalError;
//         }
//         let list = parent.children;
//         let idx = list.indexOf(this);
//         if (idx === -1) {
//             throw new InternalError;
//         }
//         list.splice(idx, 1);
//     }

//     filter(filterFn) {
//         if (typeof filterFn === 'string') {
//             let names = filterFn.split('|');
//             filterFn = (token) => names.includes(token.name);
//         }
//         let collector = [];
//         this.walk((token) => {
//             let res = filterFn(token) ?? [];
//             res = typeof res === 'boolean' ? [, res] : res;
//             res = typeof res === 'number' ? [res] : res;
//             let [walk = Walk.Continue, filt = false] = res;
//             if (filt) {
//                 collector.push(token);
//             }
//             return walk;
//         });
//         return collector;
//     }

//     unwrap() {
//         let parent = this.parent;
//         if (parent === null) {
//             throw new InternalError;
//         }
//         let plist = parent.children;
//         let list = this.children;
//         list.forEach((child) => {
//             child.parent = parent;
//         });
//         let idx = plist.indexOf(this);
//         if (idx === -1) {
//             throw new InternalError;
//         }
//         plist.splice(idx, 1, ...list);
//     }

//     replace(token) {
//         let parent = this.parent;
//         if (parent === null) {
//             throw new InternalError;
//         }
//         token.parent = parent;
//         let list = parent.children;
//         let idx = list.indexOf(this);
//         if (idx === -1) {
//             throw new InternalError;
//         }
//         list.splice(idx, 1, token);
//     }

//     // toTree(pad = ' ') {
//     //     let lines = [];
//     //     lines.push(this.name);
//     //     let list = this.children;
//     //     list.forEach((token) => {
//     //         lines.push(...token.toTree(pad).map((line) => {
//     //             return pad + line;
//     //         }));
//     //     });
//     //     return lines;
//     // }

//     tokenize(code, name = this.name) {
//         let lexer = new Lexer(code);
//         let token = this.grammar.tokenize(name, lexer);
//         if (token === null || !lexer.isEof()) {
//             throw new InternalError;
//         }
//         return token;
//     }
// }
