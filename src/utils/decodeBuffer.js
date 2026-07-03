import indexOfAll from './indexOfAll.js';

export const bom = Buffer.from([0xef, 0xbb, 0xbf]);

export default function decodeBuffer(buffer) {
    if (buffer.slice(0, bom.length).equals(bom)) {
        buffer = buffer.slice(bom.length);
    }
    let decoder = new TextDecoder('utf-8', {ignoreBOM: true});
    let content = decoder.decode(buffer);
    let all = indexOfAll(content, '\uFFFD');
    for (let idx of all) {
        let str = content.slice(0, idx + 1);
        let sub = Buffer.from(str);
        if (!sub.equals(buffer.slice(0, sub.length))) {
            return [str.slice(0, -1), true];
        }
    }
    return [content, false];
}
