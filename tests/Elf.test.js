import tape from 'tape';
import tapePromise from 'tape-promise';

import Elf from '../src/Elf.js';

const test = tapePromise.default(tape);

test('Elf / 1', (t) => {
    let elf = new Elf;
    elf.push(Buffer.from('f'));
    elf.push(Buffer.from('o'));
    elf.push(Buffer.from('o'));
    let buffer = elf.toBuffer();
    t.equal(buffer.slice(1, 4).toString(), 'ELF');
    t.equal(buffer.slice(0x60).toString(), 'foo');
    t.end();
});
