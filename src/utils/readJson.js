import readFile from './readFile.js';

export default function readJson(file) {
    let buffer = readFile(file);
    if (buffer === null) {
        return undefined;
    }
    try {
        return JSON.parse(buffer.toString());
    } catch {
        return undefined;
    }
}
