import Token from './Token.js';

const name = 'Optional';

export default class OptionalToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
