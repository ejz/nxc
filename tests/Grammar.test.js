import tape from 'tape';
import tapePromise from 'tape-promise';

import Lexer from '../src/Lexer.js';
import Grammar from '../src/Grammar.js';

const test = tapePromise.default(tape);

test('Grammar / 1', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'A -> \'a\'',
            'AB -> \'a\' | \'b\'',
            'kw12 -> `kw1` | `kw2`',
            'r12 -> /^[a-c]/ | /^[A-C]/',
            'l -> l1 | l2',
            'l1 -> l11 | l12',
            'l2 -> l21 | l22',
            'l11 -> \'11\'',
            'l12 -> \'12\'',
            'l21 -> \'21\'',
            'l22 -> \'22\'',
            'alt -> (l11 | l12) | (l21 | l22)'
        ].join('\n'),
    });
    let cases = [
        // ['A', 'a'],
        // ['AB', 'a'],
        // ['AB', 'b'],
        // ['kw12', 'kw1'],
        // ['kw12', 'kw2'],
        // ['r12', 'a'],
        // ['r12', 'c'],
        // ['r12', 'A'],
        // ['r12', 'C'],
        // ['l', '11'],
        // ['l', '12'],
        // ['l', '21'],
        // ['l', '22'],
        ['alt', '11'],
        // ['alt', '12'],
        // ['alt', '21'],
        // ['alt', '22'],
    ];
    for (let [tt, input, error] of cases) {
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

test('Grammar / 2', (t) => {
    t.end();
    return;
    let grammar = new Grammar({
        grammarFileContent: [
            'a1 -> \'a\' \'1\'',
            'a12 -> \'a\' (\'1\' | \'2\')',
        ].join('\n'),
    });
    let cases = [
        ['a12', 'a'],
    ];
    for (let [tt, input, error] of cases) {
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

test('Grammar / 2', (t) => {
    t.end();
    // return;
    // let grammar = new Grammar();
    // let cases = [
    //     ['Comment', '//'],
    //     ['Comment', '//\n'],
    //     ['Comment', '// a'],
    //     ['Comment', '// a\n'],
    //     ['Comment', '/**/'],
    //     ['Comment', '/* \n */'],
    //     ['Comment', '/* b */'],
    //     ['Comment', '/*', true],
    //     ['Whitespace', ' '],
    //     ['Whitespace', '\n'],
    //     ['Whitespace', '\r\n'],
    //     ['Program', '{}'],
    //     ['Program', '{', true],
    //     ['Program', ' {/* */} '],
    //     ['Program', ' {//\n} '],
    //     ['AssemblerStandaloneLabel', 'label:'],
    //     ['AssemblerBlock', 'asm{}'],
    //     ['AssemblerBlock', 'asm{ }'],
    //     ['AssemblerBlock', 'asm{', true],
    //     ['AssemblerBlock', 'asm{/**/}'],
    //     ['AssemblerBlock', 'asm{label:}'],
    //     ['AssemblerBlock', 'asm{ label: }'],
    //     ['AssemblerBlock', 'asm{ \n label: \n }'],
    //     ['AssemblerBlock', 'asm{ \n a: \n b: \n }'],
    //     ['AssemblerBlock', 'asm{a: b:}', true],
    //     ['AssemblerBlock', 'asm{ /**/ a: /*\n*/ b: /**/ }'],
    //     ['AssemblerBlock', 'asm{a: a = 1}'],
    //     ['AssemblerBlock', 'asm{a = 1}'],
    //     ['AssemblerBlock', 'asm{a = 1;b = 2}'],
    //     ['AssemblerBlock', 'asm{a = 1 ; b = 2}'],
    //     ['AssemblerBlock', 'asm{a =}', true],
    //     ['AssemblerBlock', 'asm{one}'],
    //     ['AssemblerBlock', 'asm{one.1}'],
    //     ['AssemblerBlock', 'asm{one.1 a}'],
    //     ['AssemblerBlock', 'asm{one.1 a, b}'],
    //     ['AssemblerBlock', 'asm{arg [eax + ebx * 2 + 0x4]}'],
    // ];
    // for (let [tt, input, error] of cases) {
    //     let lexer = new Lexer(input);
    //     let fn = () => grammar.tokenize(tt, lexer);
    //     if (error) {
    //         t.throws(fn);
    //         continue;
    //     }
    //     let token = fn();
    //     t.equals(token.stringify(), input);
    //     t.equals(lexer.isEof(), true);
    // }
    // t.end();
});

test('Grammar / 2', (t) => {
    // let grammar = new Grammar({
    //     'ws': 'space',
    //     'ws2': 'space,space',
    //     'space': ' '.charCodeAt(0),
    //     'optws': 'ws?',
    //     'ws0': 'ws*',
    //     'ws1': 'ws+',
    // });
    // {
    //     let lexer = new Lexer(' ');
    //     let token = grammar.resolve('ws', lexer);
    //     t.ok(token.name === 'ws');
    //     t.ok(token.child.name === 'space');
    // }
    // {
    //     let lexer = new Lexer('  ');
    //     let token = grammar.resolve('ws2', lexer);
    //     t.ok(token.name === 'ws2');
    //     t.ok(token.children.length === 2);
    // }
    // {
    //     let lexer = new Lexer('a');
    //     let token = grammar.resolve('optws', lexer);
    //     t.ok(token.name === 'optws');
    //     t.ok(token.child === null);
    // }
    // {
    //     let lexer = new Lexer('  ');
    //     let token = grammar.resolve('ws1', lexer);
    //     t.ok(token.name === 'ws1');
    //     t.ok(token.children.length === 2);
    // }
    t.end();
});
