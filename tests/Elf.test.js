import test from 'tape';

import Elf from '../src/Elf.js';

test('Elf / 1', (t) => {
    let elf = new Elf();
    elf.push(Buffer.from([0xb8, 0x1, 0, 0, 0]));
    elf.push(Buffer.from([0x31, 0xdb]));
    elf.push(Buffer.from([0xcd, 0x80]));
    let buffer = elf.toBuffer();
    t.equal(buffer.slice(1, 4).toString(), 'ELF');
    t.end();
});
