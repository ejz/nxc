import Token from './Token.js';

const name = 'Group';

export default class GroupToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
