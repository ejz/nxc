import test from 'tape';

import Lexer from '../src/Lexer.js';
import Whitespace from '../src/tokens/Whitespace.js';
import Comment from '../src/tokens/Comment.js';
import Token from '../src/tokens/Token.js';

test('Lexer / 1', (t) => {
    t.throws(() => new Lexer(Buffer.from([200])));
    t.throws(() => new Lexer(Buffer.from('ё')));
    t.equals(new Lexer(Buffer.from('1\n2\r\n3\r4')).content, '1\n2\n3\n4');
    t.end();
});

test('Lexer / 2', (t) => {
    {
        let lex = new Lexer('// hello\n1');
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 2);
        t.ok(wscc.collection.at(0) instanceof Comment);
        t.ok(wscc.collection.at(0).isSingleline);
        t.equals(wscc.collection.at(0).content, ' hello');
        t.ok(wscc.collection.at(1) instanceof Whitespace);
        t.equals(lex.content, '1');
    }
    {
        let lex = new Lexer('/*2*/3');
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Comment);
        t.ok(!wscc.collection.at(0).isSingleline);
        t.equals(wscc.collection.at(0).content, '2');
        t.equals(lex.content, '3');
    }
    {
        let lex = new Lexer('\t \t');
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Whitespace);
        t.ok(!wscc.gotNewline());
        t.equals(lex.content, '');
    }
    {
        let lex = new Lexer('\t \n \t');
        let wscc = lex.whitespaceCommentCollection();
        t.equals(wscc.collection.length, 1);
        t.ok(wscc.collection.at(0) instanceof Whitespace);
        t.ok(wscc.gotNewline());
        t.equals(lex.content, '');
    }
    t.end();
});

test('Lexer / 3', (t) => {
    class Parent extends Token {}
    class Child1 extends Token {}
    class Child2 extends Token {}
    let lex = new Lexer('');
    let parent = new Parent(lex);
    let child1 = new Child1(lex);
    let child2 = new Child2(lex);
    child2.flag = true;
    parent.childs = [child1, child2];
    let res1 = Lexer.find(parent, Token);
    t.equals(res1.length, 3);
    let res2 = Lexer.find(parent, Parent);
    t.equals(res2.length, 1);
    let res3 = Lexer.find(parent, Child1, Child2);
    t.equals(res3.length, 2);
    let filter = ({flag: f}) => f;
    let res4 = Lexer.find(parent, filter, Child1, Child2);
    t.equals(res4.length, 1);
    t.end();
});

test('Lexer / 4', (t) => {
    {
        let lex = new Lexer('a.b.c.1');
        let ident = lex.eatIdentifier();
        t.equals(ident, 'a');
    }
    {
        let lex = new Lexer('a.b.c.1');
        let ident = lex.eatIdentifier({multiple: '.'});
        t.equals(ident, 'a.b.c');
        t.equals(lex.content, '.1');
    }
    t.end();
});

test('Lexer / 5', (t) => {
    {
        let lex = new Lexer('123');
        lex.eat('1');
        lex.eat('2');
        lex.rewind(1);
        t.equals(lex.eat('2'), true);
    }
    {
        let lex = new Lexer('1');
        t.equals(lex.getContext(0).idx, 0);
        lex.eatRegex(/^\S/);
        t.equals(lex.getContext(0).idx, 0);
    }
    {
        let lex = new Lexer('\n');
        t.equals(lex.getContext(0).idx, 0);
        lex.eatRegex(/^\s/);
        t.equals(lex.getContext(0).idx, 1);
    }
    {
        let lex = new Lexer('1\n2\n3\n4\n5');
        t.equals(lex.getContext(0).idx, 0);
        lex.eatRegex(/^\S/);
        t.equals(lex.getContext(0).idx, 0);
        lex.eatRegex(/^\s/);
        t.equals(lex.getContext(0).idx, 1);
        lex.eatRegex(/^\S/);
        t.equals(lex.getContext(0).idx, 1);
        t.deepEqual(lex.getContext(0).lines, ['2']);
    }
    {
        let lex = new Lexer('foo\nbar');
        lex.eatRegex(/^\S+/);
        lex.eatRegex(/^\s/);
        t.equals(lex.getContext(0).idx, 1);
        t.equals(lex.getContext(0).pos, 0);
        lex.eat('ba');
        t.equals(lex.getContext(0).pos, 2);
    }
    t.end();
});
