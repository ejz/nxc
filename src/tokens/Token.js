import InternalError from '../errors/InternalError.js';

const isArray = Array.isArray;

export default class Token {
    constructor(name) {
        this.name = name;
    }

    finalize(smth = {}) {
        if (typeof smth !== 'object') {
            smth = {value: smth};
        } else if (isArray(smth)) {
            smth = {children: smth};
        }
        Object.assign(this, smth);
        return this;
    }

    is(...names) {
        return names.includes(this.name);
    }

    stringify() {
        if (this.value !== undefined) {
            return this.value;
        }
        if (this.children !== undefined) {
            return this.children.map((child) => child.stringify()).join('');
        }
        throw new InternalError;
    }
}
