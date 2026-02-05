import Lexer from './Lexer.js';
import Program from './tokens/Program.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import RegularBlock from './tokens/RegularBlock.js';
import EmptyStatement from './tokens/EmptyStatement.js';

export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    compile(buffer) {
        let lexer = new Lexer(buffer);
        let program = new Program(lexer).tokenize();
        this.normalize(program);
        return Buffer.from('');
    }

    normalize(program) {
        while (
            this.removeEmptyBlock(program)
            || this.removeEmptyStatement(program)
        ) ;
    }

    removeEmptyBlock(program) {
        let filter = ({statements}) => statements.length === 0;
        let found = Lexer.findOne(program, filter, RegularBlock, AssemblerBlock);
        if (found === null) {
            return false;
        }
        let [token, , list] = found;
        let index = list.indexOf(token);
        list.splice(index, 1);
        return true;
    }

    removeEmptyStatement(program) {
        let found = Lexer.find(program, EmptyStatement);
        for (let [token, , list] of found) {
            let index = list.indexOf(token);
            list.splice(index, 1);
        }
        return found.length !== 0;
    }
}
