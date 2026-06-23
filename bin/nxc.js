import runner from './runner.js';
import bootstrap from './bootstrap.js';
import version from './commands/version.js';
// import help from './commands/help.js';
// import execute from './commands/execute.js';
// import compile from './commands/compile.js';

const thisFile = __filename;
const commands = {version/*, help, execute, compile*/};

bootstrap({thisFile, runner: (opts) => {
    opts.commands = commands;
    return runner(opts);
}});
