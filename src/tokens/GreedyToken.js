import GenericToken from './GenericToken.js';

export default class GreedyToken extends ValueToken {
    eat() {
        return this.lexer.eatCharacter();
    }
}
