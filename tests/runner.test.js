import tape from 'tape'
import tapePromise from 'tape-promise';

import runner from '../src/runner.js';

const test = tapePromise.default(tape);

let col = [];
let _runner = (o) => {
    let opts = {
        argv: [],
        consoleError: (...m) => col.push(m.pop()),
        isStderrStreamTerminal: false,
        commands: {},
        ...o,
    };
    opts.self = opts;
    return runner(opts);
};

test('runner / 1', async (t) => {
    let commands = {
        cmd1: {
            fn: () => {},
            positionals: [1, 1],
        },
        cmd2: {
            fn: () => {},
            positionals: [0, 0],
        },
    }
    await t.rejects(_runner());
    t.match(col.pop(), /no command/i);
    await t.rejects(_runner({argv: ['-a']}));
    t.match(col.pop(), /invalid argument/i);
    await t.rejects(_runner({argv: ['command']}));
    t.match(col.pop(), /invalid command/i);
    await t.rejects(_runner({argv: ['cmd1'], commands}));
    t.match(col.pop(), /required positional/i);
    await t.rejects(_runner({argv: ['cmd2', '1'], commands}));
    t.match(col.pop(), /invalid argument/i);
    t.end();
});
