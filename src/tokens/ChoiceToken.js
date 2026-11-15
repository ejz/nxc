import GenericToken from './GenericToken.js';

const name = 'Choice';

export default class ChoiceToken extends GenericToken {
    constructor(...args) {
        super(...args, name);
    }
}
