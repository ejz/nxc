import tape from 'tape';
import tapePromise from 'tape-promise';

import Token from '../src/tokens/Token.js';
import Lexer from '../src/Lexer.js';
import Grammar from '../src/Grammar.js';

const test = tapePromise.default(tape);

test.only('Grammar / 1', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'B -> `b`',
            // 'A -> \'a\'',
            // 'C -> /^c/',
            // 'AA -> A',
            // 'AAA -> AA',
            // 'BN -> `b`*',
            // 'AB -> `a` | `b`',
            // 'ABN -> `a` | `b`*',
            // 'PQ -> `p` `q`',
            // 'PQN -> `p` `q`*',
            // 'PQO -> `p` `q`?',
            // 'Para1PQN -> (`p`) (`q`*)',
            // 'Para1PQO -> (`p`) (`q`?)',
            // 'Para2PQN -> (`p`) (`q`)*',
            // 'Para2PQO -> (`p`) (`q`)?',
            // 'test1 -> `a` (`b` `c`)? `d`',
            // 'test2 -> `a` (`b` `c`)? `b`',
            // 'test3 -> `a` (`b` | `c`) `d`',
            // 'l11 -> `11`',
            // 'l12 -> `12`',
            // 'l21 -> `21`',
            // 'l22 -> `22`',
            // 'l1 -> l11 | l12',
            // 'l2 -> l21 | l22',
            // 'alt1 -> (l11 | l12) | (l21 | l22)',
            // 'alt2 -> (l1) | (l2)',
            // 'alt3 -> l11 | (l12 | l21) | l22',
            // 'rec1 -> (l11 | (l12 | (l21 | l22)))',
            // 'rec2 -> (((l11)) | ((l12) | ((l21) | ((l22)))))',
            // 'gr1 -> * (`a` `a` `b`)',
        ].join('\n'),
    });
    let cases = [
        ['`b`', 'b'],
        // ['B', 'b'],
        // ['C', 'c'],
        // ['AAA', 'a'],
        // ['AB', 'a'],
        // ['AB', 'b'],
        // ['BN', ''],
        // ['BN', 'b'],
        // ['BN', 'bb'],
        // ['ABN', 'a'],
        // ['ABN', ''],
        // ['ABN', 'b'],
        // ['ABN', 'bb'],
        // ['PQ', 'pq'],
        // ['PQN', 'p'],
        // ['PQN', 'pq'],
        // ['PQN', 'pqq'],
        // ['PQO', 'p'],
        // ['PQO', 'pq'],
        // ['Para1PQN', 'p'],
        // ['Para1PQN', 'pq'],
        // ['Para1PQN', 'pqq'],
        // ['Para1PQO', 'p'],
        // ['Para1PQO', 'pq'],
        // ['Para2PQN', 'p'],
        // ['Para2PQN', 'pq'],
        // ['Para2PQN', 'pqq'],
        // ['Para2PQO', 'p'],
        // ['Para2PQO', 'pq'],
        // ['test1', 'abcd'],
        // ['test1', 'ad'],
        // ['test2', 'abcb'],
        // ['test2', 'ab'],
        // ['test3', 'abd'],
        // ['test3', 'acd'],
        // ['alt1', '11'],
        // ['alt1', '12'],
        // ['alt1', '21'],
        // ['alt1', '22'],
        // ['alt2', '11'],
        // ['alt2', '12'],
        // ['alt2', '21'],
        // ['alt2', '22'],
        // ['alt3', '11'],
        // ['alt3', '12'],
        // ['alt3', '21'],
        // ['alt3', '22'],
        // ['rec1', '11'],
        // ['rec1', '12'],
        // ['rec1', '21'],
        // ['rec1', '22'],
        // ['rec2', '11'],
        // ['rec2', '12'],
        // ['rec2', '21'],
        // ['rec2', '22'],
        // ['gr1', 'aab'],
        // ['gr1', 'aaab'],
    ];
    for (let [tt, input] of cases) {
        let lexer = new Lexer(input);
        let token = grammar.tokenize(tt, lexer);
        t.equals(token.toString(), input);
        t.equals(lexer.isEof(), true);
    }
    t.end();
});

test('Grammar / 2', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'Single -> `single`',
            'Opt -> `opt`?',
            'Repeat -> `r`*',
            'Choice -> `a` | `b`',
            'Seq -> `a` `b`',
            'Ref -> (`a`)',
            'Gr1 -> *',
            'Gr2 -> * `a`',
            'L1 -> `b`* ?`a` `a`',
        ].join('\n'),
    });
    let cases = [
        ['Single', 'single', ['Single', ' KeywordToken']],
        ['Opt', 'opt', ['Opt', ' KeywordToken']],
        ['Repeat', 'rr', ['Repeat', ' KeywordToken', ' KeywordToken']],
        ['Choice', 'a', ['Choice', ' KeywordToken']],
        ['Seq', 'ab', ['Seq', ' KeywordToken', ' KeywordToken']],
        ['Ref', 'a', ['Ref', ' KeywordToken']],
        ['Gr1', '', ['Gr1', ' GreedyToken']],
        ['Gr2', 'bbba', ['Gr2', ' GreedyToken', ' KeywordToken']],
        ['L1', 'bbba', ['L1', ' KeywordToken', ' KeywordToken', ' KeywordToken', ' KeywordToken']],
    ];
    for (let [tt, input, tree] of cases) {
        let lexer = new Lexer(input);
        let ast = grammar.tokenize(tt, lexer);
        t.equals(lexer.isEof(), true);
        t.deepEqual(ast.toTree(' '), tree);
    }
    t.end();
});

test('Grammar / 3', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'lk1 -> `a`* ?`l`',
            'lk2 -> `a`* ?(`a` | `l`)',
        ].join('\n'),
    });
    let cases = [
        ['lk1', 'aaaal', 'l'],
        ['lk2', 'aaaal', 'l'],
    ];
    for (let [tt, input, tail = ''] of cases) {
        let lexer = new Lexer(input);
        let token = grammar.tokenize(tt, lexer);
        t.equals(token.toString(), input.slice(0, tail.length === 0 ? undefined : -tail.length));
        t.equals(lexer.tail, tail);
    }
    t.end();
});

test('Grammar / 4', (t) => {
    let grammar = new Grammar({
        grammarFileContent: [
            'term -> term1 term2 ^ term3',
            'term1 -> `kw`',
            'term2 -> \'{\'',
            'term3 -> \';\'',
            'final -> term | `kw{a` | `kw`',
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
        t.equals(token.toString(), input);
        t.equals(lexer.isEof(), true);
    }
    t.end();
});

test('Grammar / 5', (t) => {
    let grammar = new Grammar();
    let cases = [
        // ['SinglelineComment', '//'],
        // ['SinglelineComment', '//1'],
        // ['SinglelineComment', '//\n'],
        // ['SinglelineComment', '//1\n'],
        // ['SinglelineComment', '//\r\n'],
        // ['SinglelineComment', '//\r\r', '\r'],
        // ['SinglelineComment', '// a\n1', '1'],
        // ['SinglelineComment', '// a\n'],
        // ['MultilineComment', '/**/'],
        // ['MultilineComment', '/* \n */'],
        // ['MultilineComment', '/* b */'],
        // ['Sep', ' '],
        // ['Sep', ' \t '],
        // ['Sep', '\r\n'],
        // ['Program', '{}'],
        // ['Program', ' {/* */} '],
        // ['Program', ' {//\n} '],
        // ['Program', ' ; '],
        // ['Program', ' ; { ; }'],
        // ['AssemblerBlock', 'asm{}'],
        // ['AssemblerBlock', 'asm{/**/}'],
        // ['AssemblerBlock', 'asm{;}'],
        // ['AssemblerInstruction', 'ins'],
        // ['AssemblerBlock', 'asm{ins}'],
        // ['AssemblerInstruction', 'ins.32'],
        // ['AssemblerBlock', 'asm{ins.32}'],
        // ['AssemblerInstruction', 'ins.32 eax'],
        // ['AssemblerBlock', 'asm{ins.32 eax}'],
        // ['AssemblerInstruction', 'ins.32 eax,\nebx'],
        // ['AssemblerBlock', 'asm{ins.32 eax,\nebx}'],
        // ['DecNum', '0'],
        // ['DecNum', '5'],
        // ['AssemblerArgument', '$0'],
        // ['AssemblerArgument', 'eax'],
        // ['AssemblerArgument', ':1000'],
        // ['AssemblerArgument', 'eax:1000'],
        // ['AssemblerArgument', '-1'],
        // ['AssemblerArgument', '[eax]'],
        // ['AssemblerArgument', '[eax + 1]'],
        // ['AssemblerArgument', '[1 + 4 *  eax]'],
        // ['AssemblerArgument', '[1 + eax * 4]'],
        // ['AssemblerArgument', '[eax + ebx * 4 + 0x1000]'],
        // ['AssemblerBlock', 'asm{ins1;ins2}'],
        ['AssemblerInstruction', 'ins1'],
        ['AssemblerInstruction', 'ins1\nins2', 'ins2'],
        // ['AssemblerBlock', 'asm{ins1\nins2}'],
    ];
    for (let [tt, input, tail = ''] of cases) {
        let lexer = new Lexer(input);
        let token = grammar.tokenize(tt, lexer);
        console.log({token});
        console.log(token.toTree(' '));
        console.log(token.toString());
        t.equals(token.toString(), input.slice(0, tail.length === 0 ? undefined : -tail.length));
        t.equals(lexer.tail, tail);
    }
    t.end();
});

test('Grammar / 6', (t) => {
    {
        let grammar = new Grammar();
        let lexer = new Lexer('ins1');
        let token = grammar.tokenize('AssemblerStatement', lexer);
        t.equals(token.toString(), 'ins1');
    }
    {
        // let grammar = new Grammar();
        // let lexer = new Lexer('ins1\nins2');
        // let token = grammar.tokenize('AssemblerStatement', lexer);
        // t.equals(token.toString(), 'ins1');
    }
    {
        // let grammar = new Grammar();
        // let lexer = new Lexer('ins1 arg1');
        // let token = grammar.tokenize('AssemblerStatement', lexer);
        // t.equals(token.toString(), 'ins1 arg1');
    }
    t.end();
});
