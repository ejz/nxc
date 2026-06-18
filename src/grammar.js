import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Comment from './tokens/Comment.js';
import Whitespace from './tokens/Whitespace.js';
import SinglelineComment from './tokens/SinglelineComment.js';
import SinglelineCommentBody from './tokens/SinglelineCommentBody.js';
import MultilineComment from './tokens/MultilineComment.js';
import MultilineCommentBody from './tokens/MultilineCommentBody.js';
import StandaloneAssemblerLabelEnd from './tokens/StandaloneAssemblerLabelEnd.js';
import Sep from './tokens/Sep.js';
import SepOpt from './tokens/SepOpt.js';
import AssemblerOperand from './tokens/AssemblerOperand.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, 'grammar');
const grammarContent = fs.readFileSync(grammarFile).toString();
const tokens = {};
const constructors = {};
const stringTokens = {};
const keywordTokens = {};
const referenceTokens = {};
const eatValue = (value) => (token) => {
    return token.lexer.eat(value) ? token.finalize({value}) : null;
};
const toStringToken = (value) => {
    let key = 'String.' + Object.keys(stringTokens).length;
    stringTokens[key] = eatValue(value);
    return key;
};
const toKeywordToken = (value) => {
    let key = 'Keyword.' + Object.keys(keywordTokens).length;
    keywordTokens[key] = eatValue(value);
    return key;
};
const toReferenceToken = (value) => {
    let key = 'Reference.' + Object.keys(referenceTokens).length;
    referenceTokens[key] = value;
    return key;
};
const normalizeDescriptor = (descriptor) => {
    let backup = descriptor;
    descriptor = descriptor.replace(/[^\s()]+[*+?]/g, (m) => {
        if (m.length === backup.length) {
            return m;
        }
        return toReferenceToken(m);
    });
    descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
        return toReferenceToken(p);
    });
    if (descriptor !== backup) {
        return normalizeDescriptor(descriptor);
    }
    return descriptor.trim();
}

const parts = grammarContent.replace(/#\s*\S+/g, '').split(/(\w+)\s*->\s*/).slice(1);

for (let i = 0; i < parts.length; i += 2) {
    let name = parts[i];
    let descriptor = parts[i + 1];
    descriptor = descriptor.trim();
    if (descriptor.startsWith('/') && descriptor.endsWith('/')) {
        tokens[name] = eval(descriptor);
        continue;
    }
    descriptor = descriptor.replace(/'.*?'/g, (m) => {
        return toStringToken(eval(m));
    });
    descriptor = descriptor.replace(/`(.*?)`/g, (m, p) => {
        return toKeywordToken(p);
    });
    descriptor = descriptor.replace(/\s+/g, ' ');
    descriptor = normalizeDescriptor(descriptor);
    tokens[name] = descriptor;
}

tokens.SinglelineCommentBody = SinglelineCommentBody.resolve;
tokens.MultilineCommentBody = MultilineCommentBody.resolve;
tokens.StandaloneAssemblerLabelEnd = StandaloneAssemblerLabelEnd.resolve;
tokens.AssemblerOperand = AssemblerOperand.resolve;

constructors.Comment = Comment;
constructors.Whitespace = Whitespace;
constructors.SinglelineComment = SinglelineComment;
constructors.SinglelineCommentBody = SinglelineCommentBody;
constructors.MultilineComment = MultilineComment;
constructors.MultilineCommentBody = MultilineCommentBody;
constructors.StandaloneAssemblerLabelEnd = StandaloneAssemblerLabelEnd;
constructors.Sep = Sep;
constructors.SepOpt = SepOpt;
constructors.AssemblerOperand = AssemblerOperand;

Object.assign(tokens, stringTokens, keywordTokens, referenceTokens);

console.log({tokens});

export {tokens, constructors};
// console.log(parts);


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
    
};
*/