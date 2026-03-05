import AppError from './AppError.js';

export default class NoOutputFileError extends AppError {
    constructor() {
        super('output file is not provided');
    }
}
