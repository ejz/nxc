import GenericToken from './GenericToken.js';

const name = 'Repeat';

export default class RepeatToken extends GenericToken {
    constructor(...args) {
        super(...args, name);
    }
}
