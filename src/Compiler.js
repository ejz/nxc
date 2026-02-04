import Lexer from './Lexer.js';
import Program from './tokens/Program.js';

export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    compile(buffer) {
        let lexer = new Lexer(buffer);
        let program = new Program(lexer).tokenize();
        return Buffer.from('');
    }
}
