export default function u32b(buf, off) {
    return (val) => {
        let [o] = off;
        buf.writeUInt32LE(val, o);
        off.splice(0, 1, o + 4);
    };
}
