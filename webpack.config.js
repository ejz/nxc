import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const dist = path.join(thisDirectory, 'dist');
const nxc = path.join(thisDirectory, 'bin', 'nxc.js');
const shabang = '#!/usr/bin/env node';

export default {
    entry: {nxc},
    target: 'node',
    mode: 'production',
    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
    },
    optimization: {
        minimize: true,
    },
    target: 'node',
    output: {
        filename: '[name].js',
        path: dist,
        clean: true,
    },
    plugins: [{
        apply: (compiler) => {
            compiler.hooks.assetEmitted.tap('shabang', (file, {targetPath: target}) => {
                let content = String(fs.readFileSync(target));
                content = shabang + '\n' + content.trim() + '\n';
                fs.writeFileSync(target, content);
                let mode = fs.statSync(target).mode & 0b111111111;
                fs.chmodSync(target, mode | 0b001001001);
            });
        },
    }],
};
