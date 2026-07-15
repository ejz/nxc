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
        if (normalize === false) {
            return ast;
        }
        if (normalize === true || normalize === 'removeEmptyStatement') {
            // remove empty statement ';'
            ast.filter('EmptyStatement').forEach((token) => {
                token.remove();
            });
        }
        if (normalize === true || normalize === 'unwrapRegularBlock') {
            // unwrap regular block
            ast.filter('RegularBlock').forEach((token) => {
                token.children = token.children.slice(1, -1);
                token.unwrap();
            });
        }
        if (normalize === true || normalize === 'switchAssemblerInlineLabelToStandalone') {
            // AssemblerInlineLabel -> AssemblerStandaloneLabel
            ast.filter('AssemblerInlineLabel').forEach((label) => {
                let code = label.stringify();
                label.remove();
            });
        }
        if (normalize === true || normalize === 'appendFinalExit') {
            this.appendFinalExit(ast, x86);
        }
        return ast;
    }

    lint(buffer, normalize = false) {
        let lexer = this.getLexer(buffer);
        let program = this.getAst(lexer, normalize);
        return program.stringify();
    }

    compile(buffer, normalize = true) {
        let lexer = this.getLexer(buffer);
        let ast = this.getAst(lexer, normalize);
        let elf = new Elf(x86);
        let statements = ast.filter('Statement');
        // console.log(assemblerBlocks);
        // console.log(assemblerBlocks[0].children[0]);
        for (let statement of statements) {
            if (statement.parent !== ast) {
                throw new InternalError;
            }
            let [assemblerBlock = null] = statement.children;
            if (assemblerBlock === null || !assemblerBlock.is('AssemblerBlock')) {
                throw new InternalError;
            }
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
