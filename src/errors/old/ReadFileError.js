import AppError from './AppError.js';

export default class ReadFileError extends AppError {
    constructor(file) {
        super('read file %q failed', file);
    }
}
