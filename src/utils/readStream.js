import {once} from 'node:events';

export default async function readStream(stream, waitOnReadable = false) {
    if (waitOnReadable) {
        await once(stream, 'readable');
    }
    let chunks = [];
    for await (let chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
