import Token from './Token.js';
import operations from '../arch/operations.js';

export default class AssemblerOperand extends Token {
    static resolve(token) {
        let value = token.lexer.eatOneOf(...operations);
        if (value === null) {
            return null;
        }
        return token.finalize({value});
    }
}
