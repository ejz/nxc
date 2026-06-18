import Token from './Token.js';

export default class Whitespace extends Token {
    gotNewline() {
        return this.child.name === 'Newline';
    }
}
