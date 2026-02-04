import test from 'tape';

import Program from '../../src/tokens/Program.js';
import Lexer from '../../src/Lexer.js';

test('Program / 1', (t) => {
    let input = `
        // one line comment
        ;
        /* */
        ;
        {
            ;
            /* */
        }
        {
            ;
            /* */
        }
    `;
    let lexer = new Lexer(Buffer.from(input));
    let program = new Program(lexer).tokenize();
    t.equals(program.stringify(), ';\n;\n{\n    ;\n}\n{\n    ;\n}\n');
    t.end();
});
