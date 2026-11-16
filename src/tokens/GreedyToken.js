import ValueToken from './ValueToken.js';

export default class GreedyToken extends ValueToken {
    eat() {
        return this.lexer.eatCharacter();
    }
}
