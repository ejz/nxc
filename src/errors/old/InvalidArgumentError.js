import AppError from './AppError.js';

export default class InvalidArgumentError extends AppError {
    constructor(arg) {
        super('invalid argument %q', arg);
    }
}
