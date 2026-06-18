import Token from './Token.js';

export default class Comment extends Token {
    gotNewline() {
        return this.child.gotNewline();
    }
}
