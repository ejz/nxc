import AppError from './AppError.js';

export default class RequiredArgumentError extends AppError {
    constructor(arg) {
        super('required argument %q is missing', arg);
    }
}
