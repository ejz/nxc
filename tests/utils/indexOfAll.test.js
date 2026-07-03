import tape from 'tape';
import tapePromise from 'tape-promise';

import indexOfAll from '../../src/utils/indexOfAll.js';

const test = tapePromise.default(tape);

test('indexOfAll / 1', (t) => {
    t.same(indexOfAll('foo', 'bar'), []);
    t.same(indexOfAll('foobar', 'foo'), [0]);
    t.same(indexOfAll('foobar', 'bar'), [3]);
    t.same(indexOfAll('foofoo', 'foo'), [0, 3]);
    t.same(indexOfAll('aaaa', 'aa'), [0, 2]);
    t.same(indexOfAll('aaaa', 'a'), [0, 1, 2, 3]);
    t.same(indexOfAll('abababa', 'a'), [0, 2, 4, 6]);
    t.end();
});
