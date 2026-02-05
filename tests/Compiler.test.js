import test from 'tape';

import Compiler from '../src/Compiler.js';
import Lexer from '../src/Lexer.js';
import Program from '../src/tokens/Program.js';

test('Compiler / 1', (t) => {
    let compiler = new Compiler({});
    let lex = new Lexer(`{{{}}} /* */ {;} {{;}{;}}`);
    let program = new Program(lex).tokenize();
    compiler.normalize(program);
    t.equals(program.stringify(), '');
    t.end();
});
