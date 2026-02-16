import NxcError from './NxcError.js';

export default class InvalidInputFileError extends NxcError {
    constructor() {
        super('invalid input file');
    }
}
