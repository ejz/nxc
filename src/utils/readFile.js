import fs from 'node:fs';

export default function readFile(file) {
    try {
        return fs.readFileSync(file);
    } catch {
        return null;
    }
}
