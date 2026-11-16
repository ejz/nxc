import Token from './Token.js';

const name = 'Repeat';

export default class RepeatToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
