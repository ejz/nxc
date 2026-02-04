import test from 'tape';

import Lexer from '../src/Lexer.js';

test('Lexer / 1', (t) => {
    t.throws(() => new Lexer(Buffer.from([200])));
    t.equals(new Lexer(Buffer.from('1\n2\r\n3\r4')).content, '1\n2\n3\n4');
    t.end();
});
