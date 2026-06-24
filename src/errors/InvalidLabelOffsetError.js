import AppError from './AppError.js';

export default class InvalidLabelOffsetError extends AppError {
    constructor(name, offset) {
        super('invalid label %q offset %q', name, offset);
    }
}
