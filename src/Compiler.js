// import Program from './tokens/Program.js';
// import AssemblerBlock from './tokens/AssemblerBlock.js';
// import RegularBlock from './tokens/RegularBlock.js';
// import EmptyStatement from './tokens/EmptyStatement.js';
import Lexer from './Lexer.js';
import x86 from './arch/x86.js';
import Elf from './Elf.js';
import Grammar from './Grammar.js';
import decodeBuffer from './utils/decodeBuffer.js';
import InternalError from './errors/InternalError.js';

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

    getAst(lexer, normalize) {
        let grammar = new Grammar();
        let ast = grammar.tokenize('Program', lexer);
        if (!lexer.isEof()) {
            throw lexer.error();
        }
        if (normalize === 0) {
            return ast;
        }
        if (normalize >= 1) {
            // remove empty statement ';'
            ast.filter('EmptyStatement').forEach((token) => {
                token.remove();
            });
        }
        if (normalize >= 2) {
            // unwrap regular block
            ast.filter('RegularBlock').forEach((token) => {
                token.children = token.children.filter(({name: n}) => n !== 'StringToken');
                token.unwrap();
            });
        }
        if (normalize === Infinity) {
            this.appendFinalExit(ast, x86);
        }
        return ast;
    }

    lint(buffer, normalize = 0) {
        let lexer = this.getLexer(buffer);
        let program = this.getAst(lexer, normalize);
        return program.stringify();
    }

    compile(buffer, normalize = Infinity) {
        let lexer = this.getLexer(buffer);
        let ast = this.getAst(lexer, normalize);
        let elf = new Elf(x86);
        let assemblerBlocks = ast.children;
        for (let assemblerBlock of assemblerBlocks) {
            elf.push(assemblerBlock.toBuffer(x86));
        }
        // assemblerBlock.remove();
        // let check = ast.filter('*<parent=Program>');
        // console.log(check);
        // ;
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
        return elf.toBuffer();
    }

    appendFinalExit(program, {finalExit}) {
        // let code = `asm{${finalExit}}`;
        // let assemblerBlock = new AssemblerBlock(new Lexer(code)).tokenize();
        // program.statements.push(assemblerBlock);
    }
}
