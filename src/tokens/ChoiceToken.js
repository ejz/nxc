import Token from './Token.js';

const name = 'Choice';

export default class ChoiceToken extends Token {
    constructor(...args) {
        super(...args, name);
    }
}
