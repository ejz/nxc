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

    #getProgram(lexer, {
        treeShake = true,
        doAll = false,
        doRemoveEmptyStatement = doAll,
        doRemoveAssemblerEmptyStatement = doAll,
        doUnwrapRegularBlock = doAll,
        splitVariableDeclaration = doAll,
    }) {
        let grammar = this.getGrammar();
        let variableBlock = {
            dictionary: Object.create(null),
        };
        let programAst = grammar.tokenize('Program', lexer);
        if (programAst === null || !lexer.isEof()) {
            throw lexer.error();
        }
        if (treeShake) {
            programAst = grammar.treeShake(programAst);
        }
        if (doRemoveEmptyStatement) {
            programAst.filter('EmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (doRemoveAssemblerEmptyStatement) {
            programAst.filter('AssemblerEmptyStatement').forEach((token) => {
                token.parent.remove();
            });
        }
        if (splitVariableDeclaration) {
            programAst.filter('VariableDeclaration').forEach((token) => {
                let declarators = token.filter('VariableDeclarator');
                console.log(declarators.length, declarators);
                // VariableDeclarator
            });
        }
        if (doUnwrapRegularBlock) {
            programAst.filter('RegularBlock').forEach((token) => {
                token.children = token.children.slice(1, -1);
                token.unwrap();
            });
        }
        return {programAst, variableBlock};
    }

    lint(buffer, normalizeOpts = {}) {
        let lexer = this.getLexer(buffer);
        let {programAst} = this.#getProgram(lexer, normalizeOpts);
        return programAst.toString();
    }

    compile(buffer, {doAll = true, ...rest} = {}) {
        let lexer = this.getLexer(buffer);
        let {programAst} = this.#getProgram(lexer, {doAll, ...rest});
        this.appendFinalExit(programAst, x86);
        let elf = new Elf(x86);
        let statements = programAst.filter('Statement');
        for (let statement of statements) {
            if (statement.parent !== programAst) {
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

    appendFinalExit(programAst, {finalExit}) {
        let code = `asm{${finalExit}}`;
        let statement = programAst.tokenize(code, 'Statement');
        programAst.addChild(statement);
    }
}
