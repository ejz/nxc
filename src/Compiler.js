// import Program from './tokens/Program.js';
// import AssemblerBlock from './tokens/AssemblerBlock.js';
// import RegularBlock from './tokens/RegularBlock.js';
// import EmptyStatement from './tokens/EmptyStatement.js';
import Lexer from './Lexer.js';
import x86 from './arch/x86.js';
import Elf from './Elf.js';
import Grammar from './Grammar.js';
import decodeBuffer from './utils/decodeBuffer.js';

export default class Compiler {
    constructor({logger}) {
        this.logger = logger;
    }

    getLexer(buffer) {
        let [content, error] = decodeBuffer(buffer);
        let lexer = new Lexer(content);
        if (error) {
            lexer.eatAll();
            throw lexer.error({args: 'invalid utf-8 character'});
        }
        return lexer;
    }

    getProgramToken(lexer, {
        normalize = true,
        removeEmptyBlock = normalize,
        removeEmptyStatement = normalize,
        appendFinalExit = normalize,
    } = {}) {
        let grammar = new Grammar();
        let program = grammar.tokenize('Program', lexer);
        if (!lexer.isEof()) {
            throw lexer.error();
        }
        grammar.buildAst(program);
        let ast = program;
        while (
            (removeEmptyBlock && this.removeEmptyBlock(ast))
            || (removeEmptyStatement && this.removeEmptyStatement(ast))
        ) ;
        appendFinalExit && this.appendFinalExit(ast, x86);
        return ast;
    }

    lint(buffer, opts) {
        let lexer = this.getLexer(buffer);
        let program = this.getProgramToken(lexer, {normalize: false, ...opts});
        return program.stringify();
    }

    compile(buffer, opts) {
        let lexer = this.getLexer(buffer);
        let program = this.getProgramToken(lexer, opts);
        let elf = new Elf(x86);
        return elf.toBuffer();
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
        // Lexer.find(program, (token) => {
            
        // });
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

    // buildAst(program) {

    // }
}
// let assemblerBlocks = [];
// Lexer.collect(program, (token) => {
//     if (token === program) {
//         return;
//     }
//     // if (token.name === 'SepOpt') {
//     //     return;
//     // }
//     //     if (token.parent !== program) {
//     //         throw new Error;
//     //     }
//     // console.log(token, grammar.tokenDescriptors);
//     // if (token.name !== 'AssemblerBlock') {
//     //     throw new Error;
//     // }
//     // return [LexerWalk.Ignore, true];
// });
// for (let [assemblerBlock] of assemblerBlocks) {
//     elf.push(assemblerBlock.toBuffer(x86));
// }