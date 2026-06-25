// import Program from './tokens/Program.js';
// import AssemblerBlock from './tokens/AssemblerBlock.js';
// import RegularBlock from './tokens/RegularBlock.js';
// import EmptyStatement from './tokens/EmptyStatement.js';
import Lexer, {LexerWalk} from './Lexer.js';
import x86 from './arch/x86.js';
import Elf from './Elf.js';
import Grammar from './Grammar.js';

export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    compile(buffer) {
        let decoder = new TextDecoder('utf-8', {ignoreBOM: false});
        let content = decoder.decode(buffer);
        let lexer = new Lexer(content).validate();
        let grammar = new Grammar();
        let elf = new Elf(x86);
        let program = grammar.tokenize('Program', lexer);
        if (!lexer.isEof()) {
            throw lexer.error();
        }
        this.normalize(program);
        this.appendFinalExit(program, x86);
        let assemblerBlocks = [];
        Lexer.collect(program, (token) => {
            if (token === program) {
                return;
            }
            // if (token.name === 'SepOpt') {
            //     return;
            // }
            //     if (token.parent !== program) {
            //         throw new Error;
            //     }
            // console.log(token, grammar.tokenDescriptors);
            // if (token.name !== 'AssemblerBlock') {
            //     throw new Error;
            // }
            // return [LexerWalk.Ignore, true];
        });
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
        return false;
        // let filter = ({statements}) => statements.length === 0;
        // let found = Lexer.findOne(program, filter, RegularBlock, AssemblerBlock);
        // if (found === null) {
        //     return false;
        // }
        // let [token, , list] = found;
        // let index = list.indexOf(token);
        // list.splice(index, 1);
        // return true;
    }

    removeEmptyStatement(program) {
        return false;
        // let found = Lexer.find(program, EmptyStatement);
        // for (let [token, , list] of found) {
        //     let index = list.indexOf(token);
        //     list.splice(index, 1);
        // }
        // return found.length !== 0;
    }

    appendFinalExit(program, {finalExit}) {
        // let code = `asm{${finalExit}}`;
        // let assemblerBlock = new AssemblerBlock(new Lexer(code)).tokenize();
        // program.statements.push(assemblerBlock);
    }
}
