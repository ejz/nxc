import NxcError from './NxcError.js';

export default class ReadFileError extends NxcError {
    constructor(file) {
        super('read file %q failed', file);
    }
}
