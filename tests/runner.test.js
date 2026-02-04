import tape from 'tape'
import tapePromise from 'tape-promise';

import runner from '../src/runner.js';
import NoCommandError from '../src/errors/NoCommandError.js';
import InvalidArgumentError from '../src/errors/InvalidArgumentError.js';
import InvalidCommandError from '../src/errors/InvalidCommandError.js';

const test = tapePromise.default(tape);

let noop = () => {};
let _runner = (o) => {
    let opts = {
        argv: [],
        consoleError: noop,
        isStderrStreamTerminal: false,
        commands: {},
        onError: noop,
        ...o,
    };
    opts.self = opts;
    return runner(opts);
};

test('runner / 1', async (t) => {
    let commands = {cmd: noop};
    await t.rejects(_runner(), NoCommandError);
    await t.rejects(_runner({argv: ['-a']}), InvalidArgumentError);
    await t.rejects(_runner({argv: ['command']}), InvalidCommandError);
    t.end();
});
