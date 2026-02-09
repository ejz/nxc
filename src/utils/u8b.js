export default function u8b(buf, off) {
    return (val) => {
        let [o] = off;
        buffer.writeUInt8(val, o);
        off.splice(0, 1, o + 1);
    };
}
