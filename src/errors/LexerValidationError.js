import NxcError from './NxcError.js';

export default class LexerValidationError extends NxcError {
    constructor(byte, position) {
        let message = 'only ascii is allowed: %s byte at position %s is invalid one';
        byte = '0x' + byte.toString(16);
        super(message, byte, position);
    }
}
