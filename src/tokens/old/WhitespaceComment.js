import Token from './Token.js';

export default class WhitespaceComment extends Token {
    constructor(...args) {
        super(...args);
        this.gotNewline = false;
        this._content = '';
    }

    get content() {
        return this._content;
    }

    set content(content) {
        this._content = content;
        this.gotNewline = this.content.includes('\n');
    }
}
