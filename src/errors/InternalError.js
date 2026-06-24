import AppError from './AppError.js';

export default class InternalError extends AppError {
    constructor() {
        super('internal error');
    }
}
