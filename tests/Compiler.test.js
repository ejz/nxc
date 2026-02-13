import childProcess from 'node:child_process';
import {format} from 'node:util';

import test from 'tape';

import Compiler from '../src/Compiler.js';
import Lexer from '../src/Lexer.js';
import Program from '../src/tokens/Program.js';
import writeFile from '../src/utils/writeFile.js';
import tmp from '../src/utils/tmp.js';

const binTmp = tmp('tmp-', '.bin');
const objdump = 'objdump --no-show-raw-insn -b binary -M intel -m i386 -D %s';

test('Compiler / 1', (t) => {
    let compiler = new Compiler;
    let lex = new Lexer(`{{{}}} /* */ {;} {{;}{;}}`);
    let program = new Program(lex).tokenize();
    compiler.normalize(program);
    t.equals(program.stringify(), '');
    t.end();
});

test('Compiler / 2', (t) => {
    let cases = [
        ['int 0x80', 'int 0x80'],
        ['int 16', 'int 0x10'],
        ['int -4', 'int 0xfc'],
        ['int 3', 'int3'],
        ['iret', 'iret'],
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
    ];
    let file = tmp('tmp-', '.bin');
    for (let [inp, out] of cases) {
        let code = `asm{${inp}}`;
        if (Math.random() > .5) {
            let lexer = new Lexer(code);
            let program = new Program(lexer).tokenize();
            code = program.stringify();
        }
        let buffer = new Compiler().compile(code);
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
