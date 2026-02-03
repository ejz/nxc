import test from 'tape';

import parseArgv from '../../src/utils/parseArgv.js';

test('parseArgv / 1', (t) => {
    let cases = [
        [[], []],
        [['arg'], ['arg']],
        [['arg', 'foo'], ['arg', 'foo']],
        [['-b', 'foo'], ['foo']],
        [['--', 'foo'], ['foo']],
        [['--', '-a'], ['-a']],
        [['-a', 'val', '-b', '1'], ['1']],
    ];
    for (let [inp, out] of cases) {
        t.deepEqual(parseArgv(inp, (a) => a === '-a' ? 1 : 0), out);
    }
    t.end();
});
