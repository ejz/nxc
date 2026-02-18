import NxcError from './NxcError.js';

export default class InvalidLabelOffsetError extends NxcError {
    constructor(name, offset) {
        let message = 'invalid label %q offset %q';
        super(message, name, offset);
    }
}
