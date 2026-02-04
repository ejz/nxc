import NxcError from './NxcError.js';

export default class ReadJsonError extends NxcError {
    constructor(file) {
        super('read json from `%s` failed', file);
    }
}
