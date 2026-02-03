import NxcError from './NxcError.js';

export default class InvalidCommandError extends NxcError {
    constructor(arg) {
        super('invalid command `%s`', arg);
    }
}
