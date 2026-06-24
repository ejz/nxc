import AppError from './AppError.js';

export default class SibValidationError extends AppError {
    constructor() {
        super('scale index base validation error');
    }
}
