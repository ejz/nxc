import AppError from './AppError.js';

export default class InvalidLabelNameError extends AppError {
    constructor(name) {
        super('invalid label name %q', name);
    }
}
