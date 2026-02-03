import fs from 'node:fs';

export default function writeFile(file, buffer) {
    try {
        fs.writeFileSync(file, buffer);
        return true;
    } catch {
        return false;
    }
}
