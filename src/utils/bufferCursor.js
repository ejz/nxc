export default function bufferCursor(buf) {
    return {
        buf,
        off: 0,
        u8(v) {
            this.buf.writeUInt8(v, this.off);
            this.off += 1;
            return this;
        },
        u16(v) {
            this.buf.writeUInt16LE(v, this.off);
            this.off += 2;
            return this;
        },
        u32(v) {
            this.buf.writeUInt32LE(v, this.off);
            this.off += 4;
            return this;
        },
        move(v) {
            this.off = v;
            return this;
        },
    };
}
