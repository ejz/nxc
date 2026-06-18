import Token from './Token.js';

export default class Sep extends Token {
    gotNewline() {
        return this.children.some((token) => {
            return token.child.gotNewline();
        });
    }
}
