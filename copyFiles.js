import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const PKG_SRC = path.join(thisDirectory, 'package.json');
const PKG_DST = path.join(thisDirectory, 'dist', 'package.json');
const LIC_SRC = path.join(thisDirectory, 'license.txt');
const LIC_DST = path.join(thisDirectory, 'dist', 'license.txt');
const SHA = fs.readFileSync(path.join(thisDirectory, '.git', 'refs', 'heads', 'master'));
const pkgContent = JSON.parse(fs.readFileSync(PKG_SRC));
const licContent = fs.readFileSync(LIC_SRC);
const allowedKeys = [
    'name',
    'version',
    'description',
    'dependencies',
    'bin',
    'keywords',
    'author',
    'license',
];

Object.keys(pkgContent).forEach((key) => {
    if (!allowedKeys.includes(key)) {
        delete pkgContent[key];
    }
});

pkgContent.version = [
    pkgContent.version,
    SHA.slice(0, 6),
    new Date().toISOString().replace(/T.*/, ''),
].join('-');

fs.writeFileSync(PKG_DST, JSON.stringify(pkgContent));
fs.writeFileSync(LIC_DST, licContent);
