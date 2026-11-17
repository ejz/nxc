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
        assignTokenizeCheckedCodeToNode = false,
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
        ast = grammar.treeShake(ast);
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
        if (assignTokenizeCheckedCodeToNode) {
            ast.tokenizeCheckedCode = (code, name) => {
                let lexer = new Lexer(code);
                let token = grammar.tokenize(name, lexer);
                if (token === null || !lexer.isEof()) {
                    throw new InternalError;
                }
                token = grammar.treeShake(token);
                return token;
            };
        }
        return ast;
    }

    lint(buffer, normalizeOpts = {}) {
        let lexer = this.getLexer(buffer);
        let program = this.#getProgramAst(lexer, normalizeOpts);
        return program.toString();
    }

    compile(buffer, {doAll = true, assignTokenizeCheckedCodeToNode = true, ...rest} = {}) {
        let lexer = this.getLexer(buffer);
        let ast = this.#getProgramAst(lexer, {doAll, assignTokenizeCheckedCodeToNode, ...rest});
        this.appendFinalExit(ast, x86);
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
        let statement = ast.tokenizeCheckedCode(code, 'Statement');
        ast.addChild(statement);
    }
}
