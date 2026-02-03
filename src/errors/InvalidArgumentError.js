import NxcError from './NxcError.js';

export default class InvalidArgumentError extends NxcError {
    constructor(arg) {
        super('invalid argument `%s`', arg);
    }
}
