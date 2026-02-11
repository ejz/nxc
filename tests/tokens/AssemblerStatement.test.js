import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerStatement from '../../src/tokens/AssemblerStatement.js';

test('AssemblerStatement / 1', (t) => {
    let cases = [
        ['mov eax, 2', 'mov eax, 2'],
        ['mov eax, 0xFF', 'mov eax, 0xff'],
        ['mov 0xF:0xA', 'mov 0xf:0xa'],
        ['mov 0xF:0xA', 'mov 0xf:0xa'],
        ['mov -0xF:+0xA', 'mov -0xf:0xa'],
        ['mov  [ -0x10 ]', 'mov [-0x10]'],
        ['mov  [ +0x10 ]', 'mov [0x10]'],
        ['mov  [ eax ]', 'mov [eax]'],
        ['mov  [ eax*1 ]', 'mov [eax * 1]'],
        ['mov  [ eax*100 ]', 'mov [eax * 100]'],
        ['mov  [ eax*1 +1 ]', 'mov [eax * 1 + 1]'],
        ['mov  [ +1 + eax*1 ]', 'mov [eax * 1 + 1]'],
        ['mov  [ -1 + eax*1 ]', 'mov [eax * 1 - 1]'],
        ['mov  [-1 + eax]', 'mov [eax - 1]'],
        ['mov  [eax-1]', 'mov [eax - 1]'],
        ['mov  [eax - -1]', 'mov [eax + 1]'],
        ['mov  [ eax * 4 - -0x10 ]', 'mov [eax * 4 + 0x10]'],
        ['mov  [ eax * 4 +0xFF ]', 'mov [eax * 4 + 0xff]'],
        ['mov  [ 0xFF + eax * 4]', 'mov [eax * 4 + 0xff]'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let statement = new AssemblerStatement(lexer).tokenize();
        t.equals(statement.stringify().shift(), out, inp);
    }
    t.end();
});
