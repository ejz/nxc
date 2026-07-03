import tape from 'tape';
import tapePromise from 'tape-promise';

import decodeBuffer, {bom} from '../../src/utils/decodeBuffer.js';

const test = tapePromise.default(tape);
const val = '\uFFFD';
const inv = Buffer.from([0xff]);
let alias = (...misc) => decodeBuffer(Buffer.concat(misc.map((p) => {
    return typeof p === 'string' ? Buffer.from(p) : p;
})));

test('decodeBuffer / 1', (t) => {
    t.same(alias(''), ['', false]);
    t.same(alias('foo'), ['foo', false]);
    t.same(alias(val), [val, false]);
    t.same(alias('foo', val), ['foo' + val, false]);
    t.end();
});

test('decodeBuffer / 2', (t) => {
    t.same(alias('foo', inv), ['foo', true]);
    t.same(alias('foo', inv, 'bar'), ['foo', true]);
    t.same(alias('foo', val, 'bar'), ['foo' + val + 'bar', false]);
    t.same(alias('foo', val, 'bar'), ['foo' + val + 'bar', false]);
    t.same(alias('foo', val, 'bar', inv, 'moo'), ['foo' + val + 'bar', true]);
    t.end();
});

test('decodeBuffer / 3', (t) => {
    t.same(alias(bom, 'foo'), ['foo', false]);
    t.end();
});
