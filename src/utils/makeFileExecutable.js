import fs from 'node:fs';

export default function makeFileExecutable(file) {
    try {
        let mode = fs.statSync(file).mode & 0b111111111;
        fs.chmodSync(file, mode | 0b001001001);
        return true;
    } catch {
        return false;
    }
}
