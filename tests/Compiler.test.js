import childProcess from 'node:child_process';
import {format} from 'node:util';

import tape from 'tape';
import tapePromise from 'tape-promise';

import Compiler from '../src/Compiler.js';
import Lexer from '../src/Lexer.js';
import Logger from '../src/utils/Logger.js';
import writeFile from '../src/utils/writeFile.js';
import tmp from '../src/utils/tmp.js';
import {sibAware} from '../src/arch/x86.js';

const test = tapePromise.default(tape);
const noop = () => {};
const toBuffer = (c) => Buffer.isBuffer(c) ? c : Buffer.from(c);
const getCompiler = ({logger = new Logger(noop), ...rest} = {}) => {
    let compiler = new Compiler({logger, ...rest});
    let compile = compiler.compile.bind(compiler);
    let lint = compiler.lint.bind(compiler);
    compiler.compile = (c, ...rest) => compile(toBuffer(c), ...rest);
    compiler.lint = (c, ...rest) => lint(toBuffer(c), ...rest);
    return compiler;
};
const caught = (fn) => {
    try {
        fn();
        return null;
    } catch (e) {
        return e;
    }
};
const binTmp = tmp('tmp-', '.bin');
const objdump = 'objdump --no-show-raw-insn -b binary -M intel -m i386 -D %s';

test('Compiler / 1', async (t) => {
    let compiler = getCompiler();
    t.throws(() => compiler.compile([128]));
    t.throws(() => compiler.compile('/*'));
    t.throws(() => compiler.compile('{'));
    let elf = compiler.compile('');
    t.equal(elf.slice(1, 4).toString(), 'ELF');
    t.end();
});

test('Compiler / 2', (t) => {
    let compiler = getCompiler();
    {
        let code = compiler.lint('{;}/* */;', {doRemoveEmptyStatement: true});
        t.equal(code, '{}/* */');
    }
    {
        let code = compiler.lint('asm{;}', {doRemoveAssemblerEmptyStatement: true});
        t.equal(code, 'asm{}');
    }
    {
        let code = compiler.lint('{asm{;}{/*1*/asm{;;}/*2*/asm{;;;}/*3*/}}/* */;', {doUnwrapRegularBlock: true});
        t.equal(code, 'asm{;}/*1*/asm{;;}/*2*/asm{;;;}/*3*//* */;');
    }
    t.end();
});

test('Compiler / 3', (t) => {
    let compiler = getCompiler();
    let cases = [
        ['[asd]', null],
        ['[eax]', {base: 'eax'}],
        ['[eax * 1]', {index: 'eax', scale: '1'}],
        ['[eax * 10]', null],
        ['[eax * -1]', null],
        ['[eax + ebx]', {base: 'eax', index: 'ebx'}],
        ['[eax + ebx + ecx]', null],
        ['[eax * 1 + ebx]', {base: 'ebx', index: 'eax', scale: '1'}],
        ['[0x100]', {disp: '0x100'}],
        ['[0x100 + 1]', null],
        ['[eax - -1]', {base: 'eax', disp: '1'}],
    ];
    for (let [code, sib] of cases) {
        let grammar = compiler.getGrammar();
        let lexer = new Lexer(code);
        let ast = grammar.tokenize('AssemblerArgument', lexer);
        t.ok(ast !== null);
        ast = grammar.treeShake(ast);
        sibAware(ast);
        t.deepEqual(ast.sib, sib);
    }
    t.end();
});

test('Compiler / 4', (t) => {
    let compiler = getCompiler();
    let cases = [
        ['iret', 'iret'],
        ['int 0x80', 'int 0x80'],
        ['int +0x80', 'int 0x80'],
        ['int 16', 'int 0x10'],
        ['int -4', 'int 0xfc'],
        ['int 3', 'int3'],
        ['push.8 1', 'push 0x1'],
        ['push.16 1', 'pushw 0x1'],
        ['push.32 1', 'push 0x1'],
        ['push.32 eax', 'push eax'],
        ['push.16 es', 'push es'],
        ['dec.8 al', 'dec al'],
        ['dec al', 'dec al'],
        ['mov.8 al, al', 'mov al, al'],
        ['mov al, al', 'mov al, al'],
        ['mov.8 [eax], al', 'mov byte ptr [eax], al'],
        ['mov.8 [eax + ebx], al', 'mov byte ptr [eax + ebx * 1], al'],
        ['mov.16 [eax + ebx], ax', 'mov word ptr [eax + ebx * 1], ax'],
        ['mov.16 [eax + ebx], bx', 'mov word ptr [eax + ebx * 1], bx'],
        ['mov.16 [eax + ebx], bx', 'mov word ptr [eax + ebx * 1], bx'],
        ['mov.16 [eax + ebx*8], bx', 'mov word ptr [eax + ebx * 8], bx'],
        ['mov.16 [eax + 0x20], bx', 'mov word ptr [eax + 0x20], bx'],
        ['mov.16 [eax - -0x20], bx', 'mov word ptr [eax + 0x20], bx'],
        ['mov.16 [eax - 0x20], bx', 'mov word ptr [eax - 0x20], bx'],
        ['mov.16 [eax + -0x20], bx', 'mov word ptr [eax - 0x20], bx'],
        ['mov.32 [-100 + eax + ecx * 8], ebx', 'mov dword ptr [eax + ecx * 8 - 0x64], ebx'],
        ['mov.32 [0x100], ebx', 'mov dword ptr ds:0x100, ebx'],
        ['mov.32 [esp], ebx', 'mov dword ptr [esp], ebx'],
        ['mov.32 [esp + eax], ebx', 'mov dword ptr [esp + eax * 1], ebx'],
        ['mov.32 [eax + esp], ebx', 'mov dword ptr [esp + eax * 1], ebx'],
        ['mov.32 [ebp + ecx * 4], ebx', 'mov dword ptr [ebp + ecx * 4 + 0x0], ebx'],
        ['mov.32 [eax], ebx', 'mov dword ptr [eax], ebx'],
        ['mov.32 [eax * 1], ebx', 'mov dword ptr [eax], ebx'],
        ['mov.32 [eax * 1 + 0], ebx', 'mov dword ptr [eax], ebx'],
        ['mov.32 [eax * 1 - -0xffff], ebx', 'mov dword ptr [eax + 0xffff], ebx'],
        ['lea eax, [ebx]', 'lea eax, [ebx]'],
        ['lea ax, [ebx]', 'lea ax, [ebx]'],
        ['sal eax, 1', 'shl eax, 1'],
        ['sal.32 eax, 1', 'shl eax, 1'],
        ['mov eax, 1000', 'mov eax, 0x3e8'],
        ['mov ax, 0x200', 'mov ax, 0x200'],
        ['mov eax, :1000', 'mov eax, ds:0x3e8'],
        ['mov ax, :0x200', 'mov ax, ds:0x200'],
        ['mov eax, ds:1000', 'mov eax, ds:0x3e8'],
        ['mov ax, ds:0x200', 'mov ax, ds:0x200'],
        ['l:; jmp.8 l', 'jmp 0x0'],
        ['l:; jmp l', 'jmp 0x0'],
        ['jmp.8 l; l:', 'jmp 0x2'],
        ['jmp l; l:', 'jmp 0x2'],
        ['l: jmp.8 l', 'jmp 0x0'],
        ['jmp.8 l; l: nop', 'jmp 0x2'],
    ];
    for (let [inp, out] of cases) {
        let code = `asm{${inp}}`;
        let buffer = compiler.compile(code);
        t.equal(buffer.slice(1, 4).toString(), 'ELF');
        let stdout = getAsm(buffer.slice(0x60));
        stdout = stdout.replace(/(,)/g, '$1 ');
        stdout = stdout.replace(/([+*-])/g, ' $1 ');
        t.equal(stdout, out, inp);
    }
    t.end();
});

function getAsm(buffer, lines = 1) {
    writeFile(binTmp, buffer);
    let stdout = childProcess.execSync(format(objdump, binTmp)).toString();
    return stdout.split(/\n/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
            if (!/^\d+:\s+/.test(line)) {
                return null;
            }
            line = line.replace(/^\d+:\s+/, '');
            line = line.replace(/\s+/g, ' ');
            line = line.toLowerCase();
            return line;
        })
        .filter(Boolean)
        .slice(0, lines)
        .join('; ');
}
