import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerArgument from '../../src/tokens/AssemblerArgument.js';

test('AssemblerArgument / 1', (t) => {
    let cases = [
        ['2', '2'],
        ['-2', '-2'],
        ['0x10', '0x10'],
        ['-0x10', '-0x10'],
        ['0x10A', '0x10A'],
        ['0x10a', '0x10a'],
        ['ds:1', 'ds:1'],
        [':1', ':1'],
        ['1:1', '1:1'],
        ['[-0x10]', '[-0x10]'],
        ['[+0x10]', '[+0x10]'],
        ['[eax]', '[eax]'],
        ['[eax * 1]', '[eax * 1]'],
        ['[eax * 100]', '[eax * 100]'],
        ['[eax * 1 + +1]', '[eax * 1 + +1]'],
        ['[eax*1++1]', '[eax * 1 + +1]'],
        ['[+1+eax*1]', '[eax * 1 + +1]'],
        ['[-1+eax*1]', '[eax * 1 + -1]'],
        ['[-1+eax]', '[eax + -1]'],
        ['[eax-1]', '[eax - 1]'],
        ['[eax--1]', '[eax - -1]'],
        ['[eax*4--0x10]', '[eax * 4 - -0x10]'],
        ['[eax*4+0xFF]', '[eax * 4 + 0xFF]'],
        ['[0xFF+eax*4]', '[eax * 4 + 0xFF]'],
        ['eax', 'eax'],
        ['_label', '_label'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let argument = new AssemblerArgument(lexer).tokenize();
        t.equals(argument.stringify(), out, inp);
    }
    t.end();
});

test('AssemblerArgument / 2', (t) => {
    let inp = 'a, b, 1, [10], _la';
    let lexer = new Lexer(inp);
    let got = AssemblerArgument.tokenizeArguments(lexer);
    t.equals(AssemblerArgument.stringifyArguments(got), inp);
    t.end();
});
