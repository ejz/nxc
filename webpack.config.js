import path from 'node:path';
import {fileURLToPath} from 'node:url';

import readFile from './src/utils/readFile.js';
import writeFile from './src/utils/writeFile.js';
import makeFileExecutable from './src/utils/makeFileExecutable.js';

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
                let content = readFile(target).toString();
                content = shabang + '\n' + content.trim() + '\n';
                writeFile(target, content);
                makeFileExecutable(target);
            });
        },
    }],
};
