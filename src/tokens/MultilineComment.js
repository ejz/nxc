import Token from './Token.js';

export default class MultilineComment extends Token {
    gotNewline() {
        let [, body] = this.children;
        return body.gotNewline();
    }
}
