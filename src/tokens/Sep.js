import Token from './Token.js';

const isInline = (v) => !v.includes('\r') && !v.includes('\n');

export default class Sep extends Token {
    get isInline() {
        return isInline(this.stringify());
    }
}
