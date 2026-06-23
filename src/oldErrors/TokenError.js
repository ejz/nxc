import LexerError from './LexerError.js';

export default class TokenError extends LexerError {
    constructor(token, {
        position = token.start,
        catchLen,
        ...rest
    } = {}) {
        if (catchLen === undefined) {
            catchLen = 0;
            catchLen ||= token.end - token.start;
            catchLen ||= token.lexer.position - token.start;
        }
        super(token.lexer, {position, catchLen, ...rest});
    }
}
