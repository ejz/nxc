import AppError from './AppError.js';

export default class LexerValidationError extends AppError {
    constructor(byte, position) {
        let message = 'only ascii is allowed: %s byte at position %s is invalid one';
        byte = '0x' + byte.toString(16);
        super(message, byte, position);
    }
}
