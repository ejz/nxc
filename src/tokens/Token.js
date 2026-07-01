import InternalError from '../errors/InternalError.js';

export default class Token {
    constructor(name) {
        this.name = name;
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
        if (this.children !== undefined) {
            return this.children.map((child) => child.stringify()).join('');
        }
        throw new InternalError;
    }
}
