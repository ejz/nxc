import AppError from './AppError.js';

export default class NoCommandError extends AppError {
    constructor() {
        super('command is not provided');
    }
}
