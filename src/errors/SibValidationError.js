import AppError from './AppError.js';

export default class SibValidationError extends AppError {
    constructor() {
        let message = 'sib validation error';
        super(message);
    }
}
