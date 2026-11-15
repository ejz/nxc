import GenericToken from './GenericToken.js';

const name = 'Optional';

export default class OptionalToken extends GenericToken {
    constructor(...args) {
        super(...args, name);
    }
}
