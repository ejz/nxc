import Token from './Token.js';

const isInline = (v) => !v.includes('\r') && !v.includes('\n');

export default class InlineSep extends Token {
    prevalidate() {
        return isInline(this.toString());
    }
}
