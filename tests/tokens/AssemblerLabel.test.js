import test from 'tape';

import Lexer from '../../src/Lexer.js';
import AssemblerLabel from '../../src/tokens/AssemblerLabel.js';

test('AssemblerLabel / 1', (t) => {
    let cases = [
        ['label:', 'label:'],
        ['Label:', 'Label:'],
        ['_label:', '_label:'],
    ];
    for (let [inp, out] of cases) {
        let lexer = new Lexer(inp);
        let label = new AssemblerLabel(lexer).tokenize();
        t.equals(label.stringify(), out, inp);
    }
    t.end();
});
