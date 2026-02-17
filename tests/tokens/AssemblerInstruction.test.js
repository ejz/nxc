import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerInstruction from '../../src/tokens/AssemblerInstruction.js';

test('AssemblerInstruction / 1', (t) => {
    let cases = [
        ['a.B.1', 'a.B.1'],
        ['a.B.1 a', 'a.B.1 a'],
        ['a.B.1 a, b', 'a.B.1 a, b'],
        ['a.B', 'a.B'],
        ['a.B a', 'a.B a'],
        ['a.B a, b', 'a.B a, b'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let instruction = new AssemblerInstruction(lexer).tokenize();
        t.equals(instruction.stringify(), out, inp);
    }
    t.end();
});
