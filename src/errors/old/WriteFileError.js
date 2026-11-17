import AppError from './AppError.js';

export default class WriteFileError extends AppError {
    constructor(file) {
        super('write file %q failed', file);
    }
}
