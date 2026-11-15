import Token from './Token.js';

const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class GenericToken extends Token {
    constructor(...args) {
        super(...args);
        this.children = [];
    }

    finalize(children, parents) {
        if (children === null) {
            return super.finalize(false, parents);
        }
        this.children = toArray(children);
        return super.finalize(true, parents);
    }

    toString() {
        return this.children.map((token) => token.toString()).join('');
    }
}
