import Lexer from './Lexer.js';
import Program from './tokens/Program.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import RegularBlock from './tokens/RegularBlock.js';
import EmptyStatement from './tokens/EmptyStatement.js';
import x86 from './arch/x86.js';
import Elf from './Elf.js';

export default class Compiler {
    constructor({logger = null} = {}) {
        this.logger = logger;
    }

    compile(buffer) {
        let lexer = new Lexer(buffer);
        let program = new Program(lexer).tokenize();
        this.normalize(program);
        let elf = new Elf(x86);
        let filter = (token, parent) => {
            if (parent !== program) {
                throw new Error;
            }
            return true;
        };
        let assemblerBlocks = Lexer.find(program, filter, AssemblerBlock);
        for (let [assemblerBlock] of assemblerBlocks) {
            elf.push(assemblerBlock.toBuffer(x86));
        }
        return elf.toBuffer();
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
