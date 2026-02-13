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
        x86.alias = {'inc.eax': {nargs: 0, alias: 'inc eax'}};
        t.deepEqual(toBuffer('inc.eax'), toBuffer('inc eax'));
    }
    {
        x86.alias = {'add.eax': {nargs: 1, alias: 'add eax, $0'}};
        t.deepEqual(toBuffer('add.eax 0x100'), toBuffer('add eax, 0x100'));
    }
    x86.alias = alias;
    t.end();
});

test('AssemblerStatement / 3', (t) => {
    t.deepEqual(toBuffer('syscall.exit'), toBuffer('syscall.exit 0'));
    t.deepEqual(toBuffer('eax = 1'), toBuffer('mov eax, 1'));
    t.deepEqual(toBuffer('eax = 0'), toBuffer('xor eax, eax'));
    t.end();
});

export function toBuffer(inp) {
    let lexer = new Lexer(inp);
    let statement = new AssemblerStatement(lexer).tokenize();
    return Array.from(statement.toBuffer(x86));
}
