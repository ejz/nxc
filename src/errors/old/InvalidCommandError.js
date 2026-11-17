import AppError from './AppError.js';

export default class InvalidCommandError extends AppError {
    constructor(arg) {
        super('invalid command %q', arg);
    }
}
