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

    getGrammar() {
        return new Grammar();
    }

    getAst(lexer, normalize) {
        let grammar = this.getGrammar();
        let ast = grammar.tokenize('Program', lexer);
        if (ast === null || !lexer.isEof()) {
            throw lexer.error();
        }
        if (normalize === false) {
            return ast;
        }
        if (normalize === true || normalize === 'removeEmptyStatement') {
            ast.filter('EmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (normalize === true || normalize === 'removeAssemblerEmptyStatement') {
            ast.filter('AssemblerEmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (normalize === true || normalize === 'unwrapRegularBlock') {
            ast.filter('RegularBlock').forEach((token) => {
                token.children = token.children.slice(1, -1);
                token.unwrap();
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
        return program.toString();
    }

    compile(buffer, normalize = true) {
        let lexer = this.getLexer(buffer);
        let ast = this.getAst(lexer, normalize);
        let elf = new Elf(x86);
        let statements = ast.filter('Statement');
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
        return elf.toBuffer();
    }

    appendFinalExit(ast, {finalExit}) {
        let code = `asm{${finalExit}}`;
        let statement = ast.tokenize(code, 'Statement');
        statement.parent = ast;
        ast.children.push(statement);
    }
}
