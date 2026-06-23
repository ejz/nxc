import {u8, u16, u32} from '../types.js';

export default function bufferCursor(buf) {
    return {
        buf,
        off: 0,
        u8(v) {
            this.buf[u8.method](v, this.off);
            this.off += u8.size;
            return this;
        },
        u16(v) {
            this.buf[u16.method](v, this.off);
            this.off += u16.size;
            return this;
        },
        u32(v) {
            this.buf[u32.method](v, this.off);
            this.off += u32.size;
            return this;
        },
        move(v) {
            this.off = v;
            return this;
        },
    };
}
