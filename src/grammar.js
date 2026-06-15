const CR = '\r';
const LF = '\n';
const CRLF = CR + LF;
const TAB = '\t';
const SPACE = ' ';
const strings = {};
const choice = (...arr) => arr.join('|');
const sequence = (...arr) => arr.join(',');
const multiple = (s) => s + '*';
const string = (str, k = str, p = 'String') => {
    let key = p + '.' + k;
    strings[key] ??= (token) => {
        return token.lexer.eat(str) ? token.finalize() : null;
    };
    return key;
};
const keyword = (kw, k) => string(kw, k, 'Keyword');

export default Object.assign({
    'Program': sequence(
        'WhitespaceCommentCollection',
        'StatementWhitespaceCommentCollectionCollection',
    ),
    'StatementWhitespaceCommentCollectionCollection': multiple('StatementWhitespaceCommentCollection'),
    'StatementWhitespaceCommentCollection': sequence(
        'Statement',
        'WhitespaceCommentCollection',
    ),
    'Statement': choice(
        'AssemblerBlock',
        'EmptyStatement',
        'RegularBlock',
    ),
    'RegularBlock': sequence(
        string('{'),
        'WhitespaceCommentCollection',
        'StatementWhitespaceCommentCollectionCollection',
        string('}'),
    ),
    'EmptyStatement': string(';'),
    'WhitespaceCommentCollection': multiple('WhitespaceComment'),
    'WhitespaceComment': choice(
        'Whitespace',
        'Comment',
    ),
    'AssemblerBlock': sequence(
        keyword('asm'),
        'WhitespaceCommentCollection',
        string('{'),
        'WhitespaceCommentCollection',
        'AssemblerStatementWhitespaceCommentCollectionCollection',
        string('}'),
    ),
    'AssemblerStatementWhitespaceCommentCollectionCollection': multiple('AssemblerStatementWhitespaceCommentCollection'),
    'AssemblerStatementWhitespaceCommentCollection': choice(
        // 'AssemblerStatement',
        'WhitespaceCommentCollection',
    ),
    // 'AssemblerStatement': choice(
    // ),
    SinglelineComment(token) {
        if (!token.lexer.eat('//')) {
            return null;
        }
        let tuple = token.lexer.eatTill(CRLF, CR, LF);
        let [comment, newline = null] = tuple ?? [token.lexer.eatAll()];
        token.lexer.proceed((newline ?? '').length);
        return token.finalize({newline, comment});
    },
    MultilineComment(token) {
        if (!token.lexer.eat('/*')) {
            return null;
        }
        let tuple = token.lexer.eatTill('*/');
        let [comment = null, newline] = tuple ?? [];
        if (comment === null) {
            return null;
        }
        token.lexer.proceed(newline.length);
        return token.finalize({comment});
    },
    'Comment': choice(
        'SinglelineComment',
        'MultilineComment',
    ),
    'Whitespace': choice(
        string(SPACE),
        string(TAB),
        'Newline',
    ),
    'Newline': choice(
        string(CRLF),
        string(CR),
        string(LF),
    ),
}, strings);
