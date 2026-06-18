import Token from './Token.js';

export default class SinglelineComment extends Token {
    gotNewline() {
        let [, body] = this.children;
        return body.gotNewline();
    }
}
