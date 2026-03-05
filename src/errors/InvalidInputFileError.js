import AppError from './AppError.js';

export default class InvalidInputFileError extends AppError {
    constructor() {
        super('invalid input file');
    }
}
