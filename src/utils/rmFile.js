import fs from 'node:fs';

export default function rmFile(entry) {
    try {
        fs.rmSync(entry, {recursive: true, force: true});
        return true;
    } catch {
        return false;
    }
}
