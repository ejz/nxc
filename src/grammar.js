import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Comment from './tokens/Comment.js';
import Whitespace from './tokens/Whitespace.js';
import SinglelineComment from './tokens/SinglelineComment.js';
import SinglelineCommentBody from './tokens/SinglelineCommentBody.js';
import MultilineComment from './tokens/MultilineComment.js';
import MultilineCommentBody from './tokens/MultilineCommentBody.js';
import Sep from './tokens/Sep.js';
import SepOpt from './tokens/SepOpt.js';
import AssemblerOperand from './tokens/AssemblerOperand.js';
import End from './tokens/End.js';
import SameLineSep from './tokens/SameLineSep.js';

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

constructors.End = End;
tokens.End = End.resolve;

constructors.SameLineSep = SameLineSep;
tokens.SameLineSep = SameLineSep.resolve;

constructors.AssemblerOperand = AssemblerOperand;
tokens.AssemblerOperand = AssemblerOperand.resolve;

constructors.SinglelineCommentBody = SinglelineCommentBody;
tokens.SinglelineCommentBody = SinglelineCommentBody.resolve;

constructors.MultilineCommentBody = MultilineCommentBody;
tokens.MultilineCommentBody = MultilineCommentBody.resolve;

constructors.Comment = Comment;
constructors.Whitespace = Whitespace;
constructors.SinglelineComment = SinglelineComment;
constructors.MultilineComment = MultilineComment;
constructors.Sep = Sep;
constructors.SepOpt = SepOpt;

Object.assign(tokens, stringTokens, keywordTokens, referenceTokens);

export {tokens, constructors};
