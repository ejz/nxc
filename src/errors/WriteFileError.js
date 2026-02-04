import NxcError from './NxcError.js';

export default class WriteFileError extends NxcError {
    constructor(file) {
        super('write file %q failed', file);
    }
}
