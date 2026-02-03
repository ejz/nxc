import NxcError from './NxcError.js';

export default class NoCommandError extends NxcError {
    constructor() {
        super('command is not provided');
    }
}
