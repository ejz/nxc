import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerStatement from '../../src/tokens/AssemblerStatement.js';
import x86 from '../../src/arch/x86.js';

test('AssemblerStatement / 1', (t) => {
    let cases = [
        ['mov 1, 2', 'mov 1, 2'],
        ['a = 1', 'a = 1'],
        ['l:', 'l:'],
        ['l: mov 1, 2', 'l: mov 1, 2'],
        ['l: a = 1', 'l: a = 1'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let statement = new AssemblerStatement(lexer).tokenize();
        t.equals(statement.stringify().shift(), out, inp);
    }
    t.end();
});

test('AssemblerStatement / 2', (t) => {
    let isa = x86.isa;
    {
        x86.isa = {...isa, 'inc.eax': {args: 0, alias: 'inc eax'}};
        t.deepEqual(toBuffer('inc.eax'), toBuffer('inc eax'));
    }
    {
        x86.isa = {...isa, 'add.eax': {args: 1, alias: 'add eax, $0'}};
        t.deepEqual(toBuffer('add.eax 0x100'), toBuffer('add eax, 0x100'));
    }
    x86.isa = isa;
    t.end();
});

test('AssemblerStatement / 3', (t) => {
    let nop = toBuffer('xchg eax, eax');
    t.deepEqual(toBuffer('syscall.exit'), toBuffer('syscall.exit 0'));
    t.deepEqual(toBuffer('eax = 1'), toBuffer('mov eax, 1'));
    t.deepEqual(toBuffer('eax = 0'), toBuffer('xor eax, eax'));
    t.deepEqual(toBuffer('nop'), nop);
    t.deepEqual(toBuffer('nop 2'), nop.concat(nop));
    t.deepEqual(toBuffer('nop 1'), nop);
    t.deepEqual(toBuffer('nop 0'), []);
    t.deepEqual(toBuffer('nop 90'), [].concat(...new Array(90).fill(nop)));
    t.deepEqual(toBuffer('eax--'), toBuffer('dec eax'));
    t.deepEqual(toBuffer('cf != cf'), toBuffer('cmc'));
    t.deepEqual(toBuffer('cf = 0'), toBuffer('clc'));
    t.deepEqual(toBuffer('cf = 1'), toBuffer('stc'));
    t.end();
});

export function toBuffer(inp) {
    let lexer = new Lexer(inp);
    let statement = new AssemblerStatement(lexer).tokenize();
    return Array.from(statement.toBuffer(x86));
}
