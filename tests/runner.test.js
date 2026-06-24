import tape from 'tape';
import tapePromise from 'tape-promise';

import runner from '../bin/runner.js';
import NoCommandError from '../src/errors/NoCommandError.js';
import InvalidArgumentError from '../src/errors/InvalidArgumentError.js';
import InvalidCommandError from '../src/errors/InvalidCommandError.js';

const test = tapePromise.default(tape);
const noop = () => {};
const getRunner = (o) => {
    o = {
        argv: [],
        consoleError: noop,
        isStderrStreamTerminal: false,
        commands: {},
        onError: noop,
        ...o,
    };
    o.self = o;
    return (oo) => runner({...o, ...oo});
};

test('runner / 1', async (t) => {
    let r = getRunner();
    await t.rejects(r(), NoCommandError);
    await t.rejects(r({argv: ['-a']}), InvalidArgumentError);
    await t.rejects(r({argv: ['command']}), InvalidCommandError);
    t.end();
});
