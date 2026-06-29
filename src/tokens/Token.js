import InternalError from '../errors/InternalError.js';

export default class Token {
    constructor(name) {
        this.name = name;
        // this.lexer = lexer;
        // this.start = this.position;
        // this.end = null;
    }

    finalize(obj = {}) {
        Object.assign(this, obj);
        return this;
    }

    stringify() {
        if (this.value !== undefined) {
            return this.value;
        }
        if (this.child !== undefined) {
            if (this.child === null) {
                return '';
            }
            return this.child.stringify();
        }
        // console.log({this: this});
        throw new InternalError;
        // if (this.children !== undefined) {
        //     return this.children.map((child) => child.stringify()).join('');
        // }
    }
        // this.end = position;

    // get position() {
    //     return this.lexer.position;
    // }

    // get content() {
    //     return this.lexer.content.slice(this.start, this.end ?? this.start);
    // }

    

    // getChildren() {
    //     if (this.children !== undefined) {
    //         return this.children;
    //     }
    //     if (this.child !== undefined) {
    //         if (this.child === null) {
    //             return [];
    //         }
    //         return this.child.getChildren();
    //     }
    //     if (this.value !== undefined) {
    //         return [];
    //     }
    //     throw new InternalError;
    // }
}
