import {fileURLToPath} from 'node:url';

import runner from './runner.js';
import bootstrap from './bootstrap.js';
import version from './commands/version.js';
import help from './commands/help.js';
import compile from './commands/compile.js';

const thisFile = fileURLToPath(import.meta.url);
const commands = {version, help, compile};

bootstrap({thisFile, runner: (opts) => {
    opts.commands = commands;
    return runner(opts);
}});
