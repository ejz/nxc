import NxcError from './NxcError.js';

export default class SibValidationError extends NxcError {
    constructor() {
        let message = 'sib validation error';
        super(message);
    }
}
