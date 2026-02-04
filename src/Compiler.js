import Lexer from './Lexer.js';

export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    compile(buffer) {
        let lexer = new Lexer(buffer);
        return Buffer.from(lexer.content);
    }
}
