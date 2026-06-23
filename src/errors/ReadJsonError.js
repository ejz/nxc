import AppError from './AppError.js';

export default class ReadJsonError extends AppError {
    constructor(file) {
        super('read json from %q failed', file);
    }
}
