import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import SinglelineCommentBody from './tokens/SinglelineCommentBody.js';
import MultilineCommentBody from './tokens/MultilineCommentBody.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, 'grammar');
const grammarContent = fs.readFileSync(grammarFile).toString();
const tokens = {};
const constructors = {};
const stringTokens = {};
const aliasTokens = {};
const repeatTokens = {};
const toStringToken = (value) => {
    let key = 'String.' + Object.keys(stringTokens).length;
    stringTokens[key] = (token) => {
        return token.lexer.eat(value) ? token.finalize({value}) : null;
    };
    return key;
};
const toAliasToken = (value) => {
    let key = 'Alias.' + Object.keys(aliasTokens).length;
    aliasTokens[key] = value;
    return key;
};
const toRepeatToken = (value) => {
    let key = 'Repeat.' + Object.keys(repeatTokens).length;
    repeatTokens[key] = value;
    return key;
};

const parts = grammarContent.split(/(\w+)\s*=\s*/).slice(1);

for (let i = 0; i < parts.length; i += 2) {
    let name = parts[i];
    let desc = parts[i + 1];
    while (true) {
        let bk = desc;
        desc = desc.trim();
        desc = desc.replace(/'.*?'/g, (m) => {
            return toStringToken(eval(m));
        });
        desc = desc.replace(/\((.*?)\)/g, (m, p) => {
            return toAliasToken(p);
        });
        desc = desc.replace(/\S+\*/g, (m) => {
            return toRepeatToken(m);
        });
        desc = desc.replace(/\s*\|\s*/g, '|');
        desc = desc.replace(/\s+/g, ' ');
        if (bk === desc) {
            break;
        }
    }
    tokens[name] = desc;
}

tokens.SinglelineCommentBody = SinglelineCommentBody.resolve;
constructors.SinglelineCommentBody = SinglelineCommentBody;

tokens.MultilineCommentBody = MultilineCommentBody.resolve;
constructors.MultilineCommentBody = MultilineCommentBody;

Object.assign(tokens, stringTokens, aliasTokens, repeatTokens);

export {tokens, constructors};
// console.log(parts);

// const CR = '\r';
// const LF = '\n';
// const CRLF = CR + LF;
// const TAB = '\t';
// const SPACE = ' ';
// const strings = {};
// const choice = (...arr) => arr.join('|');
// const sequence = (...arr) => arr.join(',');
// const multiple = (s) => s + '*';

// const keyword = (kw, k = kw) => string(kw, k, 'Keyword');
/*
Object.assign({
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
    'AssemblerStatementWhitespaceCommentCollection': sequence(
        'AssemblerStatement',
        'WhitespaceCommentCollection',
    ),
    'AssemblerStatement': choice(
        'StandaloneAssemblerLabel',
        'AssemblerOperation',
        // 'AssemblerInstruction',
    ),
    'AssemblerOperation': sequence(
        'AssemblerArgument',
        'AssemblerOperand',
        'AssemblerArgumentCollection',
    ),
    'AssemblerArgumentCollection': sequence(
        'AssemblerArgument',
        'CommaAssemblerArgumentCollection',
    ),
    'CommaAssemblerArgumentCollection': multiple('CommaAssemblerArgument'),
    'CommaAssemblerArgument': sequence(
        'Comma',
        'AssemblerArgument',
    ),
    'Comma': sequence(
        'WhitespaceCommentCollection',
        string(',', 'comma'),
        'WhitespaceCommentCollection',
    ),
    'AssemblerArgument': choice(
        'AssemblerReference',
        'AssemblerAddress',
        'AssemblerInteger',
        'AssemblerScaleIndexBase',
        'AssemblerRegister',
        'AssemblerLabelName',
    ),
    'AssemblerAddress': sequence(
        'AssemblerAddressSegment',
        string(':', 'colon'),
        'AssemblerAddressOffset',
    ),
    'AssemblerReference': sequence(
        string('$', 'dollar'),
        'DecimalNumber',
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
        return token.finalize({rawValue: value});
    },
    DecimalNumber(token) {
        let value = token.lexer.eatDecimalNumber();
        if (value === null) {
            return null;
        }
        return token.finalize({rawValue: value});
    },
    End(token, grammar) {
        let lex = token.lexer;
        let hasEnd = false;
        let res = lex.try(() => {
            let wcc = grammar.tokenize('WhitespaceCommentCollection', lex);
            return (
                lex.isEof()
                || wcc.gotNewline()
                || (hasEnd = lex.eat(';'))
                || lex.look(() => lex.eat('}'))
            );
        });
        if (!res) {
            return null;
        }
        return token.finalize({hasEnd});
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
            return '/*' + this.comment + '* /';
        }

        gotNewline() {
            return this.comment.includes(CR) || this.comment.includes(LF);
        }
    },
};
*/