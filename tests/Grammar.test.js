import tape from 'tape';
import tapePromise from 'tape-promise';

import Lexer from '../src/Lexer.js';
import Grammar from '../src/Grammar.js';

const test = tapePromise.default(tape);

test('Grammar / 1', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'A -> \'a\'',
            'B -> `b`',
            'C -> /^c/',
            'AB -> `a` | `b`',
            'BN -> `b`*',
            'ABN -> `a` | `b`*',
            'PQ -> `p` `q`',
            'PQN -> `p` `q`*',
            'PQO -> `p` `q`?',
            'Para1PQN -> (`p`) (`q`*)',
            'Para1PQO -> (`p`) (`q`?)',
            'Para2PQN -> (`p`) (`q`)*',
            'Para2PQO -> (`p`) (`q`)?',
            'test1 -> `a` (`b` `c`)? `d`',
            'test2 -> `a` (`b` `c`)? `b`',
            'l11 -> `11`',
            'l12 -> `12`',
            'l21 -> `21`',
            'l22 -> `22`',
            'l1 -> l11 | l12',
            'l2 -> l21 | l22',
            'alt1 -> (l11 | l12) | (l21 | l22)',
            'alt2 -> (l1) | (l2)',
            'alt3 -> l11 | (l12 | l21) | l22',
            'rec1 -> (l11 | (l12 | (l21 | l22)))',
            'rec2 -> (((l11)) | ((l12) | ((l21) | ((l22)))))',
        ].join('\n'),
    });
    let cases = [
        ['A', 'a'],
        ['B', 'b'],
        ['C', 'c'],
        ['AB', 'a'],
        ['AB', 'b'],
        ['BN', ''],
        ['BN', 'b'],
        ['BN', 'bb'],
        ['ABN', 'a'],
        ['ABN', ''],
        ['ABN', 'b'],
        ['ABN', 'bb'],
        ['PQ', 'pq'],
        ['PQN', 'p'],
        ['PQN', 'pq'],
        ['PQN', 'pqq'],
        ['PQO', 'p'],
        ['PQO', 'pq'],
        ['Para1PQN', 'p'],
        ['Para1PQN', 'pq'],
        ['Para1PQN', 'pqq'],
        ['Para1PQO', 'p'],
        ['Para1PQO', 'pq'],
        ['Para2PQN', 'p'],
        ['Para2PQN', 'pq'],
        ['Para2PQN', 'pqq'],
        ['Para2PQO', 'p'],
        ['Para2PQO', 'pq'],
        ['test1', 'abcd'],
        ['test1', 'ad'],
        ['test2', 'abcb'],
        ['test2', 'ab'],
        ['alt1', '11'],
        ['alt1', '12'],
        ['alt1', '21'],
        ['alt1', '22'],
        ['alt2', '11'],
        ['alt2', '12'],
        ['alt2', '21'],
        ['alt2', '22'],
        ['alt3', '11'],
        ['alt3', '12'],
        ['alt3', '21'],
        ['alt3', '22'],
        ['rec1', '11'],
        ['rec1', '12'],
        ['rec1', '21'],
        ['rec1', '22'],
        ['rec2', '11'],
        ['rec2', '12'],
        ['rec2', '21'],
        ['rec2', '22'],
    ];
    for (let [tt, input] of cases) {
        let lexer = new Lexer(input);
        let token = grammar.tokenize(tt, lexer);
        t.equals(token.stringify(), input);
        t.equals(lexer.isEof(), true);
    }
    t.end();
});

test('Grammar / 2', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'term -> term1 term2 ^ term3',
            'term1 -> `kw`',
            'term2 -> \'{\'',
            'term3 -> \';\'',
            'final -> term | `kw{a` | `kw`'
        ].join('\n'),
    });
    let cases = [
        ['final', 'kw'],
        ['final', 'kw{;'],
        ['final', 'kw{', true],
        ['final', 'kw{a', true],
    ];
    for (let [tt, input, error = false] of cases) {
        let lexer = new Lexer(input);
        let fn = () => grammar.tokenize(tt, lexer);
        if (error) {
            t.throws(fn);
            continue;
        }
        let token = fn();
        t.equals(token.stringify(), input);
        t.equals(lexer.isEof(), true);
    }
    t.end();
});

test('Grammar / 3', (t) => {
    let grammar = new Grammar();
    let cases = [
        ['SinglelineComment', '//'],
        ['SinglelineComment', '//1'],
        ['SinglelineComment', '//\n'],
        ['SinglelineComment', '//1\n'],
        ['SinglelineComment', '//\r\n'],
        ['SinglelineComment', '//\r\r', '\r'],
        ['SinglelineComment', '// a\n1', '1'],
        ['SinglelineComment', '// a\n'],
        ['MultilineComment', '/**/'],
        ['MultilineComment', '/* \n */'],
        ['MultilineComment', '/* b */'],
        ['Sep', ' '],
        ['Sep', ' \t '],
        ['Sep', '\r\n'],
        ['Whitespace', ' \t'],
        ['Whitespace', '\r\n'],
        ['Program', '{}'],
        ['Program', ' {/* */} '],
        ['Program', ' {//\n} '],
        ['Program', ' ; '],
        ['Program', ' ; { ; }'],
        // ['Program', '{', true],
        // ['AssemblerStandaloneLabel', 'label:'],
        // ['AssemblerBlock', 'asm{}'],
        // ['AssemblerBlock', 'asm{ }'],
        // ['AssemblerBlock', 'asm{', true],
        // ['AssemblerBlock', 'asm{/**/}'],
        // ['AssemblerBlock', 'asm{label:}'],
        // ['AssemblerBlock', 'asm{ label: }'],
        // ['AssemblerBlock', 'asm{ \n label: \n }'],
        // ['AssemblerBlock', 'asm{ \n a: \n b: \n }'],
        // ['AssemblerBlock', 'asm{a: b:}', true],
        // ['AssemblerBlock', 'asm{ /**/ a: /*\n*/ b: /**/ }'],
        // ['AssemblerBlock', 'asm{a: a = 1}'],
        // ['AssemblerBlock', 'asm{a = 1}'],
        // ['AssemblerBlock', 'asm{a = 1;b = 2}'],
        // ['AssemblerBlock', 'asm{a = 1 ; b = 2}'],
        // ['AssemblerBlock', 'asm{a =}', true],
        // ['AssemblerBlock', 'asm{one}'],
        // ['AssemblerInstructionOperandSize', '.4'],
        // ['AssemblerInstructionName', 'one.two'],
        // ['AssemblerInstructionName', 'one.two.three'],
        // ['DecNum', '0'],
        // ['DecNum', '5'],
        // ['AssemblerInstructionBody', 'one.two.5'],
        // ['AssemblerBlock', 'asm{one.1}'],
        // ['AssemblerBlock', 'asm{one.1 a}'],
        // ['AssemblerBlock', 'asm{one.1 a, b}'],
        // ['AssemblerBlock', 'asm{arg [eax + ebx * 2 + 0x4]}'],
    ];
    for (let [tt, input, tail = ''] of cases) {
        let lexer = new Lexer(input);
        let token = grammar.tokenize(tt, lexer);
        t.equals(token.stringify(), input.slice(0, tail.length === 0 ? undefined : -tail.length));
        t.equals(lexer.tail, tail);
    }
    t.end();
});

// test('Grammar / 3', (t) => {
//     // let grammar = new Grammar({
//     //     'ws': 'space',
//     //     'ws2': 'space,space',
//     //     'space': ' '.charCodeAt(0),
//     //     'optws': 'ws?',
//     //     'ws0': 'ws*',
//     //     'ws1': 'ws+',
//     // });
//     // {
//     //     let lexer = new Lexer(' ');
//     //     let token = grammar.resolve('ws', lexer);
//     //     t.ok(token.name === 'ws');
//     //     t.ok(token.child.name === 'space');
//     // }
//     // {
//     //     let lexer = new Lexer('  ');
//     //     let token = grammar.resolve('ws2', lexer);
//     //     t.ok(token.name === 'ws2');
//     //     t.ok(token.children.length === 2);
//     // }
//     // {
//     //     let lexer = new Lexer('a');
//     //     let token = grammar.resolve('optws', lexer);
//     //     t.ok(token.name === 'optws');
//     //     t.ok(token.child === null);
//     // }
//     // {
//     //     let lexer = new Lexer('  ');
//     //     let token = grammar.resolve('ws1', lexer);
//     //     t.ok(token.name === 'ws1');
//     //     t.ok(token.children.length === 2);
//     // }
//     t.end();
// });
