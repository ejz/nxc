export default class AppError extends Error {
	constructor(message, ...args) {
        super(message);
        this.arguments = args;
    }
}
