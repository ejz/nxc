import GenericToken from './GenericToken.js';

const name = 'Group';

export default class GroupToken extends GenericToken {
    constructor(...args) {
        super(...args, name);
    }
}
