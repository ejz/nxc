import test from 'tape';

import Lexer from '../src/Lexer.js';
import Grammar from '../src/Grammar.js';

test('Grammar / 1', (t) => {
    let grammar = new Grammar();
    let cases = [
        ['Comment', '// a'],
        ['Comment', '/* b */'],
        ['Whitespace', ' '],
        ['Program', '{}'],
        ['Program', ' { } '],
        ['Program', ' {/* */} '],
        ['Program', ' {//\n} '],
        ['Program', '/*', true],
        ['Program', '{', true],
    ];
    for (let [tt, input, error] of cases) {
        let fn = () => grammar.tokenize(tt, new Lexer(input));
        if (error) {
            t.throws(fn);
            continue;
        }
        let token = fn();
        t.equals(token.stringify(), input);
    }
    t.end();
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
