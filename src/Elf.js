import u8b from './utils/u8b.js';
import u16b from './utils/u16b.js';
import u32b from './utils/u32b.js';

export default class Elf {
    constructor() {
        this.buffers = [];
    }

    push(buffer) {
        this.buffers.push(buffer);
    }

    toBuffer() {
        let size = this.buffers.reduce((acc, buf) => acc + buf.length, 0);
        let header = this.getHeader(size);
        return Buffer.concat([header, ...this.buffers]);
    }

    getHeader(codeSize) {
        let entry = 0x80000000;
        let e_phnum = 1;
        let e_phentsize = 0x20;
        let e_phoff = 0x40;
        let size = e_phoff + e_phnum * e_phentsize;
        let buffer = Buffer.alloc(size, 0);
        let off = [0];
        let u8 = u8b(buffer, off);
        let u16 = u16b(buffer, off);
        let u32 = u32b(buffer, off);
        //
        u8(0x7f);
        u8('E'.charCodeAt());
        u8('L'.charCodeAt());
        u8('F'.charCodeAt());
        u8(0x1); // 32-bit
        u8(0x1); // little-endian
        u8(0x1); // 1 version
        //
        off.splice(0, 1, 0x10);
        u16(0x2); // e_type (ET_EXEC)
        u16(0x3); // e_machine (x86)
        u32(1); // e_version
        u32(entry + size); // e_entry
        u32(e_phoff); // e_phoff
        u32(0); // e_shoff
        u32(0); // e_flags
        u16(52); // e_ehsize (52 = 32-bit)
        u16(e_phentsize); // e_phentsize
        u16(e_phnum); // e_phnum
        u16(40); // e_shentsize (40 = 32-bit)
        u16(0); // e_shnum
        u16(0); // e_shstrndx
        //
        off.splice(0, 1, e_phoff);
        u32(1); // p_type (PT_LOAD)
        u32(0); // p_offset
        u32(entry); // p_vaddr
        u32(entry); // p_paddr
        u32(size + codeSize); // p_filesz
        u32(size + codeSize); // p_memsz
        u32(0x1 + 0x4); // p_flags (x - 1, w - 2, r - 4)
        u32(0x1000); // p_align
        //
        return buffer;
    }
}
