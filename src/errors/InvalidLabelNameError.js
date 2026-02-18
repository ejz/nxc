import NxcError from './NxcError.js';

export default class InvalidLabelNameError extends NxcError {
    constructor(name) {
        let message = 'invalid label name %q';
        super(message, name);
    }
}
