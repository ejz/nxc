export default class WhitespaceCommentCollection {
    constructor() {
        this.collection = [];
    }

    notEmpty() {
        return this.collection.length !== 0;
    }

    gotNewline() {
        return this.collection.some((token) => {
            return token.gotNewline;
        });
    }

    push(token) {
        this.collection.push(token);
    }
}
