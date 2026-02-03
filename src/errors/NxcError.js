export default class NxcError extends Error {
	constructor(message, ...args) {
        super(message);
        this.arguments = args;
    }
}
