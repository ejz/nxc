import Token from './Token.js';

const name = 'Lookup';

export default class LookupToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
