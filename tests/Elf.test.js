import test from 'tape';

import Elf from '../src/Elf.js';

test('Elf / 1', (t) => {
    let elf = new Elf();
    elf.push(Buffer.from('f'));
    elf.push(Buffer.from('o'));
    elf.push(Buffer.from('o'));
    let buffer = elf.toBuffer();
    t.equal(buffer.slice(1, 4).toString(), 'ELF');
    t.equal(buffer.slice(0x60).toString(), 'foo');
    t.end();
});
