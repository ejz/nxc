import NxcError from './NxcError.js';

export default class RequiredArgumentError extends NxcError {
    constructor(arg) {
        super('required argument %q is missing', arg);
    }
}
