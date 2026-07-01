import Token from './Token.js';
import operations from '../arch/operations.js';

export default class AssemblerOperand extends Token {
    static resolve(lexer) {
        let value = lexer.eatAny(...operations);
        if (value === null) {
            return null;
        }
        return {value};
    }
}
