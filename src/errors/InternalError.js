import NxcError from './NxcError.js';

export default class InternalError extends NxcError {
    constructor() {
        let message = 'internal error';
        super(message);
    }
}
