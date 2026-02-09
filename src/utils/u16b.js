export default function u16b(buf, off) {
    return (val) => {
        let [o] = off;
        buffer.writeUInt16LE(val, o);
        off.splice(0, 1, o + 2);
    };
}
