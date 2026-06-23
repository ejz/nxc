import AppError from './AppError.js';

export default class InternalError extends AppError {
    constructor() {
        let message = 'internal error';
        super(message);
    }
}
