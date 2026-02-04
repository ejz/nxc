import NxcError from './NxcError.js';

export default class NoOutputFileError extends NxcError {
    constructor() {
        super('output file is not provided');
    }
}
