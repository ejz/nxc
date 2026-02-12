import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerStatement from '../../src/tokens/AssemblerStatement.js';
import x86 from '../../src/arch/x86.js';

test('AssemblerStatement / 1', (t) => {
    let cases = [
        ['mov eax, 2', 'mov eax, 2'],
        ['mov eax, 0xFF', 'mov eax, 0xFF'],
        ['mov eax, -0xFF', 'mov eax, -0xFF'],
        ['mov eax, +0xFF', 'mov eax, +0xFF'],
        ['mov 0xF:0xA', 'mov 0xF:0xA'],
        ['mov -0xF:+0xA', 'mov -0xF:+0xA'],
        ['mov [-0x10]', 'mov [-0x10]'],
        ['mov [+0x10]', 'mov [+0x10]'],
        ['mov [eax]', 'mov [eax]'],
        ['mov [eax * 1]', 'mov [eax * 1]'],
        ['mov [eax * 100]', 'mov [eax * 100]'],
        ['mov [eax * 1 + +1]', 'mov [eax * 1 + +1]'],
        ['mov [eax*1++1]', 'mov [eax * 1 + +1]'],
        ['mov [+1+eax*1]', 'mov [eax * 1 + +1]'],
        ['mov [-1+eax*1]', 'mov [eax * 1 + -1]'],
        ['mov [-1+eax]', 'mov [eax + -1]'],
        ['mov [eax-1]', 'mov [eax - 1]'],
        ['mov [eax--1]', 'mov [eax - -1]'],
        ['mov [eax*4--0x10]', 'mov [eax * 4 - -0x10]'],
        ['mov [eax*4+0xFF]', 'mov [eax * 4 + 0xFF]'],
        ['mov [0xFF+eax*4]', 'mov [eax * 4 + 0xFF]'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let statement = new AssemblerStatement(lexer).tokenize();
        t.equals(statement.stringify().shift(), out, inp);
    }
    t.end();
});

test('AssemblerStatement / 2', (t) => {
    let alias = x86.alias;
    {
        let lexer = new Lexer('inc.eax');
        let statement = new AssemblerStatement(lexer).tokenize();
        x86.alias = {'inc.eax': {nargs: 0, alias: 'inc eax'}};
        let buffer = statement.toBuffer(x86);
        t.deepEqual([...buffer], [0x40]);
    }
    {
        let lexer = new Lexer('add.eax 0x100');
        let statement = new AssemblerStatement(lexer).tokenize();
        x86.alias = {'add.eax': {nargs: 1, alias: 'add eax, $0'}};
        let buffer = statement.toBuffer(x86);
        t.deepEqual([...buffer], [0x5, 0x0, 0x1, 0x0, 0x0]);
    }
    x86.alias = alias;
    t.end();
});
