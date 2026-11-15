import Token from './Token.js';

export default class ValueToken extends Token {
    constructor(...args) {
        super(...args);
        this.value = '';
    }

    finalize(value, parents) {
        if (value === null) {
            return super.finalize(false, parents);
        }
        this.value = value;
        return super.finalize(true, parents);
    }

    toString() {
        return this.value;
    }
}
