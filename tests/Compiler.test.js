import childProcess from 'node:child_process';
import {format} from 'node:util';

import test from 'tape';

import Compiler from '../src/Compiler.js';
import Lexer from '../src/Lexer.js';
import Program from '../src/tokens/Program.js';
import writeFile from '../src/utils/writeFile.js';
import tmp from '../src/utils/tmp.js';

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
        ['int  0x80', 'int 0x80'],
        ['int 16', 'int 0x10'],
        ['int 1;int 2', 'int 0x1; int 0x2'],
        ['int -4', 'int 0xfc'],
        ['int 3', 'int3'],
        ['iret', 'iret'],
        ['push.8 1', 'push 0x1'],
        ['push.16 1', 'pushw 0x1'],
        ['push.32 1', 'push 0x1'],
        ['push.32 eax', 'push eax'],
        ['push.16 es', 'push es'],
        ['dec.8 al;inc.8 ah', 'dec al; inc ah'],
        ['mov.8 al, al', 'mov al, al'],
        ['mov.8 [eax], al', 'mov byte ptr [eax], al'],
    ];
    let file = tmp('tmp-', '.bin');
    for (let [inp, out] of cases) {
        let buffer = new Compiler().compile(`asm {${inp}}`);
        t.equal(buffer.slice(1, 4).toString(), 'ELF');
        writeFile(file, buffer.slice(0x60));
        let stdout = childProcess.execSync(format(objdump, file)).toString();
        stdout = stdout.split(/\n/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((line) => {
                if (!/^\d+:\s+/.test(line)) {
                    return null;
                }
                line = line.replace(/^\d+:\s+/, '');
                line = line.replace(/\s+/g, ' ');
                line = line.replace(/,/g, ', ');
                line = line.replace(/\b\w+\s+PTR\b/, (m) => m.toLowerCase());
                return line;
            })
            .filter(Boolean)
            .join('; ');
        t.equal(stdout, out);
    }
    // console.log();
    // console.log();
    // console.log(buffer.toString('base64'));
    t.end();
});
