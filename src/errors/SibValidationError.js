import AppError from './AppError.js';

export default class SibValidationError extends AppError {
    constructor() {
        super('sib validation error');
    }
}
