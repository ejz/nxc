import Token from './Token.js';

const name = 'Sequence';

export default class SequenceToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
