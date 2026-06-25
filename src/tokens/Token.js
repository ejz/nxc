import InternalError from '../errors/InternalError.js';

export default class Token {
    constructor(name, lexer, parent) {
        this.name = name;
        this.lexer = lexer;
        this.parent = parent;
        this.start = this.position;
        this.end = null;
    }

    finalize({position = this.position, ...rest} = {}) {
        this.end = position;
        Object.assign(this, rest);
        return this;
    }

    get position() {
        return this.lexer.position;
    }

    get content() {
        return this.lexer.content.slice(this.start, this.end ?? this.start);
    }

    stringify() {
        if (this.children !== undefined) {
            return this.children.map((child) => child.stringify()).join('');
        }
        if (this.child !== undefined) {
            if (this.child === null) {
                return '';
            }
            return this.child.stringify();
        }
        if (this.value !== undefined) {
            return this.value;
        }
        throw new InternalError;
    }

    getChildren() {
        if (this.children !== undefined) {
            return this.children;
        }
        if (this.child !== undefined) {
            if (this.child === null) {
                return [];
            }
            return this.child.getChildren();
        }
        if (this.value !== undefined) {
            return [];
        }
        throw new InternalError;
    }
}
