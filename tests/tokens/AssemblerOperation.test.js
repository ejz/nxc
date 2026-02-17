import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerOperation from '../../src/tokens/AssemblerOperation.js';

test('AssemblerOperation / 1', (t) => {
    let cases = [
        ['a = 1', 'a = 1'],
        ['a++', 'a++'],
        ['a = 1, 2', 'a = 1, 2'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let operation = new AssemblerOperation(lexer).tokenize();
        t.equals(operation.stringify(), out, inp);
    }
    t.end();
});
