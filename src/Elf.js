import bufferCursor from './utils/bufferCursor.js';

export default class Elf {
    constructor(arch) {
        this.arch = arch;
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
        let cursor = bufferCursor(buffer);
        //
        cursor.u8(0x7f);
        cursor.u8('E'.charCodeAt());
        cursor.u8('L'.charCodeAt());
        cursor.u8('F'.charCodeAt());
        cursor.u8(0x1); // 32-bit
        cursor.u8(0x1); // little-endian
        cursor.u8(0x1); // 1 version
        //
        cursor.move(0x10);
        cursor.u16(0x2); // e_type (ET_EXEC)
        cursor.u16(0x3); // e_machine (x86)
        cursor.u32(1); // e_version
        cursor.u32(entry + size); // e_entry
        cursor.u32(e_phoff); // e_phoff
        cursor.u32(0); // e_shoff
        cursor.u32(0); // e_flags
        cursor.u16(52); // e_ehsize (52 = 32-bit)
        cursor.u16(e_phentsize); // e_phentsize
        cursor.u16(e_phnum); // e_phnum
        cursor.u16(40); // e_shentsize (40 = 32-bit)
        cursor.u16(0); // e_shnum
        cursor.u16(0); // e_shstrndx
        //
        cursor.move(e_phoff);
        cursor.u32(1); // p_type (PT_LOAD)
        cursor.u32(0); // p_offset
        cursor.u32(entry); // p_vaddr
        cursor.u32(entry); // p_paddr
        cursor.u32(size + codeSize); // p_filesz
        cursor.u32(size + codeSize); // p_memsz
        cursor.u32(0x1 + 0x4); // p_flags (x - 1, w - 2, r - 4)
        cursor.u32(0x1000); // p_align
        //
        return buffer;
    }
}
