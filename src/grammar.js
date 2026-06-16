import Token from './Token.js';

const CR = '\r';
const LF = '\n';
const CRLF = CR + LF;
const TAB = '\t';
const SPACE = ' ';
const strings = {};
const choice = (...arr) => arr.join('|');
const sequence = (...arr) => arr.join(',');
const multiple = (s) => s + '*';
const string = (str, k, p = 'String') => {
    let key = p + '.' + k;
    strings[key] ??= (token) => {
        return token.lexer.eat(str) ? token.finalize({rawString: str}) : null;
    };
    return key;
};
const keyword = (kw, k = kw) => string(kw, k, 'Keyword');

export const tokens = Object.assign({
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
        string('{', 'openCurlyBrace'),
        'WhitespaceCommentCollection',
        'StatementWhitespaceCommentCollectionCollection',
        string('}', 'closeCurlyBrace'),
    ),
    'EmptyStatement': string(';', 'semicolon'),
    'WhitespaceCommentCollection': multiple('WhitespaceComment'),
    'WhitespaceComment': choice(
        'Whitespace',
        'Comment',
    ),
    //
    //
    //
    'AssemblerBlock': sequence(
        keyword('asm'),
        'WhitespaceCommentCollection',
        string('{', 'openCurlyBrace'),
        'WhitespaceCommentCollection',
        'AssemblerStatementWhitespaceCommentCollectionCollection',
        string('}', 'closeCurlyBrace'),
    ),
    'AssemblerStatementWhitespaceCommentCollectionCollection': multiple('AssemblerStatementWhitespaceCommentCollection'),
    'AssemblerStatementWhitespaceCommentCollection': choice(
        'AssemblerStatement',
        'WhitespaceCommentCollection',
    ),
    'AssemblerStatement': choice(
        'StandaloneAssemblerLabel',
        // 'AssemblerOperation',
        // 'AssemblerInstruction',
    ),
    'StandaloneAssemblerLabel': sequence(
        'AssemblerLabel',
        'End',
    ),
    'AssemblerLabel': sequence(
        'AssemblerLabelName',
        string(':', 'colon'),
    ),
    AssemblerLabelName(token) {
        let value = token.lexer.eatIdentifier({
            upperCase: true,
            underscore: true,
        });
        if (value === null) {
            return null;
        }
        return token.finalize({value});
    },
    //
    //
    //
    End(token, grammar) {
        let lex = token.lexer;
        let hasEnd = false;
        let res = lex.try(() => {
            let wcc = grammar.tokenize('WhitespaceCommentCollection', lex);
            return (
                lex.isEOF()
                || (hasEnd = lex.eat(';'))
                || wcc.gotNewline()
                || lex.look(() => lex.eat('}'))
            );
        });
        if (!res) {
            return null;
        }
        return token.finalize({hasEnd});
    },
    //
    //
    //
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
        string(SPACE, 'space'),
        string(TAB, 'tab'),
        'Newline',
    ),
    'Newline': choice(
        string(CRLF, 'crlf'),
        string(CR, 'cr'),
        string(LF, 'lf'),
    ),
}, strings);

export const constructors = {
    AssemblerLabelName: class extends Token {
        stringify() {
            return this.value;
        }
    },
    End: class extends Token {
        stringify() {
            return this.hasEnd ? ';' : '';
        }
    },
    WhitespaceCommentCollection: class extends Token {
        gotNewline() {
            return this.children.some((token) => {
                return token.child.gotNewline();
            });
        }
    },
    Whitespace: class extends Token {
        gotNewline() {
            return this.child.name === 'Newline';
        }
    },
    Comment: class extends Token {
        gotNewline() {
            return this.child.gotNewline();
        }
    },
    SinglelineComment: class extends Token {
        stringify() {
            return '//' + this.comment + (this.newline ?? '');
        }

        gotNewline() {
            return this.newline !== null;
        }
    },
    MultilineComment: class extends Token {
        stringify() {
            return '/*' + this.comment + '*/';
        }

        gotNewline() {
            return this.comment.includes(CR) || this.comment.includes(LF);
        }
    },
};
