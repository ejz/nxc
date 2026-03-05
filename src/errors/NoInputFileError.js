import AppError from './AppError.js';

export default class NoInputFileError extends AppError {
    constructor() {
        super('input file is not provided');
    }
}
