import test from 'tape';

import Lexer from '../src/Lexer.js';
import Grammar from '../src/Grammar.js';

test('Grammar / 1', (t) => {
    let grammar = new Grammar({
        'space': ' '.charCodeAt(0),
    });
    let lexer = new Lexer(' ');
    let token = grammar.resolve('space', lexer);
    t.ok(lexer.isEOF());
    t.ok(token.name === 'space');
    t.ok(token.lexer === lexer);
    t.ok(token.start === 0);
    t.ok(token.end === 1);
    t.ok(token.content === ' ');
    t.end();
});

test('Grammar / 1', (t) => {
    let grammar = new Grammar({
        'ws': 'space',
        'ws2': 'space,space',
        'space': ' '.charCodeAt(0),
        'optws': 'ws?',
        'ws0': 'ws*',
        'ws1': 'ws+',
    });
    {
        let lexer = new Lexer(' ');
        let token = grammar.resolve('ws', lexer);
        t.ok(token.name === 'ws');
        t.ok(token.child.name === 'space');
    }
    {
        let lexer = new Lexer('  ');
        let token = grammar.resolve('ws2', lexer);
        t.ok(token.name === 'ws2');
        t.ok(token.children.length === 2);
    }
    {
        let lexer = new Lexer('a');
        let token = grammar.resolve('optws', lexer);
        t.ok(token.name === 'optws');
        t.ok(token.child === null);
    }
    {
        let lexer = new Lexer('  ');
        let token = grammar.resolve('ws1', lexer);
        t.ok(token.name === 'ws1');
        t.ok(token.children.length === 2);
    }
    t.end();
});
