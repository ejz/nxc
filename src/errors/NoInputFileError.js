import NxcError from './NxcError.js';

export default class NoInputFileError extends NxcError {
    constructor() {
        super('input file is not provided');
    }
}
