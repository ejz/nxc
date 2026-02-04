export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    compile(buffer) {
        this.logger.debug('start ..');
        return buffer;
    }
}
