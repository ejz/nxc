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
            throw lexer.error();
        }
        return lexer;
    }

    getGrammar() {
        return new Grammar();
    }

    #getProgramAst(lexer, {
        treeShake = true,
        doAll = false,
        doRemoveEmptyStatement = doAll,
        doRemoveAssemblerEmptyStatement = doAll,
        doUnwrapRegularBlock = doAll,
    }) {
        let grammar = this.getGrammar();
        let ast = grammar.tokenize('Program', lexer);
        if (ast === null || !lexer.isEof()) {
            throw lexer.error();
        }
        if (treeShake) {
            ast = grammar.treeShake(ast);
        }
        if (doRemoveEmptyStatement) {
            ast.filter('EmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (doRemoveAssemblerEmptyStatement) {
            ast.filter('AssemblerEmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (doUnwrapRegularBlock) {
            ast.filter('RegularBlock').forEach((token) => {
                token.children = token.children.slice(1, -1);
                token.unwrap();
            });
        }
        return ast;
    }

    lint(buffer, normalizeOpts = {}) {
        let lexer = this.getLexer(buffer);
        let program = this.#getProgramAst(lexer, normalizeOpts);
        return program.toString();
    }

    compile(buffer, {doAll = true, assignGrammar = true, ...rest} = {}) {
        let lexer = this.getLexer(buffer);
        let programAst = this.#getProgramAst(lexer, {doAll, assignGrammar, ...rest});
        this.appendFinalExit(programAst, x86);
        let elf = new Elf(x86);
        let statements = programAst.filter('Statement');
        for (let statement of statements) {
            if (statement.parent !== programAst) {
                throw new InternalError;
            }
            let [assemblerBlock = null] = statement.children;
            // console.log(assemblerBlock);
            if (assemblerBlock === null || !assemblerBlock.is('AssemblerBlock')) {
                throw new InternalError;
            }
            elf.push(assemblerBlock.toBuffer(x86));
        }
        return elf.toBuffer();
    }

    appendFinalExit(programAst, {finalExit}) {
        let code = `asm{${finalExit}}`;
        let statement = programAst.tokenize(code, 'Statement');
        programAst.addChild(statement);
    }
}
