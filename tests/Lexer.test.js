import test from 'tape';

import Lexer from '../src/Lexer.js';
import Whitespace from '../src/tokens/Whitespace.js';
import Comment from '../src/tokens/Comment.js';

test('Lexer / 1', (t) => {
    t.throws(() => new Lexer(Buffer.from([200])));
    t.equals(new Lexer(Buffer.from('1\n2\r\n3\r4')).content, '1\n2\n3\n4');
    t.end();
});

test('Lexer / 2', (t) => {
    {
        let lex = new Lexer(Buffer.from('// hello\n1'));
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 2);
        t.ok(wscc.collection.at(0) instanceof Comment);
        t.ok(wscc.collection.at(0).isSingleline);
        t.equals(wscc.collection.at(0).content, ' hello');
        t.ok(wscc.collection.at(1) instanceof Whitespace);
        t.equals(lex.content, '1');
    }
    {
        let lex = new Lexer(Buffer.from('/*2*/3'));
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Comment);
        t.ok(!wscc.collection.at(0).isSingleline);
        t.equals(wscc.collection.at(0).content, '2');
        t.equals(lex.content, '3');
    }
    {
        let lex = new Lexer(Buffer.from('\t \t'));
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Whitespace);
        t.ok(!wscc.gotNewline());
        t.equals(lex.content, '');
    }
    {
        let lex = new Lexer(Buffer.from('\t \n \t'));
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Whitespace);
        t.ok(wscc.gotNewline());
        t.equals(lex.content, '');
    }
    t.end();
});
