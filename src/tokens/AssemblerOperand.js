import Token from './Token.js';
import operations from '../arch/operations.js';

export default class AssemblerOperand extends Token {
    static resolve(lexer) {
        return lexer.eatAny(...operations);
    }
}
