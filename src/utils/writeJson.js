import writeFile from './writeFile.js';

export default function writeJson(file, obj) {
    try {
        obj = JSON.stringify(obj);
        if (obj === undefined) {
            return false;
        }
        return writeFile(file, obj);
    } catch {
        return false;
    }
}
