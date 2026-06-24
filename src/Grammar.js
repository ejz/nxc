import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
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

import InternalError from './errors/InternalError.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    Comment,
    Whitespace,
    SinglelineComment,
    SinglelineCommentBody,
    MultilineComment,
    MultilineCommentBody,
    Sep,
    SepOpt,
    AssemblerOperand,
    End,
    SameLineSep,
};
const eatValue = (value) => (token) => token.lexer.eat(value) ? token.finalize({value}) : null;

export default class Grammar {
    constructor({
        grammarFileContent = fs.readFileSync(grammarFile).toString(),
        defaultTokenContructor = Token,
        tokenConstructors = tokenCtors,
    }) {
        this.grammarFileContent = grammarFileContent;
        this.defaultTokenContructor = defaultTokenContructor;
        this.tokenConstructors = tokenConstructors;
        this.tokens = {};
        this.populateTokens();
    }

    populateTokens() {
        let content = this.grammarFileContent
            .split(/\n/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((line) => !line.startsWith('#'))
            .join('\n')
        ;
        let nameString = 0;
        let nameKeyword = 0;
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, descriptor] = pairs.slice(i);
            descriptor = descriptor.trim();
            if (descriptor === '!') {
                this.populateToken(name);
                continue;
            }
            if (descriptor.startsWith('/^') && descriptor.endsWith('/')) {
                let regex = eval(descriptor);
                let fn = (token) => {
                    let value = token.lexer.eatRegex(regex);
                    if (value === null) {
                        return null;
                    }
                    return token.finalize({value});
                };
                this.populateToken(name, fn);
                continue;
            }
            descriptor = descriptor.replace(/'.*?'/g, (m) => {
                let string = eval(m);
                let name = 'String.' + (nameString++);
                return this.populateToken(name, eatValue(string));
            });
            descriptor = descriptor.replace(/`(.*?)`/g, (m, p) => {
                let keyword = p;
                let name = 'Keyword.' + (nameKeyword++);
                return this.populateToken(name, eatValue(keyword));
            });
            descriptor = descriptor.replace(/\s+/g, ' ');
            let references = {};
            let value = this.normalizeTokenDescriptor(descriptor, references);
            this.populateToken(name, value);
            for (let name in references) {
                let value = references[name];
                this.populateToken(name, value);
            }
        }
    }

    normalizeTokenDescriptor(descriptor, references) {
        let toReferenceToken = (ref) => {
            let name = 'Reference.' + Object.keys(references).length;
            references[name] = this.castDescriptorToResolver(ref);
            return name;
        };
        let changed = false;
        descriptor = descriptor.replace(/[^\s()]+[*+?]/g, (m) => {
            if (m.length === descriptor.length) {
                return m;
            }
            changed = true;
            return toReferenceToken(m);
        });
        descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
            changed = true;
            return toReferenceToken(p);
        });
        if (!changed) {
            return this.castDescriptorToResolver(descriptor);
        }
        return this.normalizeTokenDescriptor(descriptor, references);
    }

    castDescriptorToResolver(descriptor) {
        let getter = (v) => {
            if (v === '^') {
                return v;
            }
            let fn = this.tokens[v];
            if (fn === undefined) {
                throw new InternalError;
            }
            return fn;
        };
        let star = descriptor.endsWith('*');
        let plus = descriptor.endsWith('+');
        let ques = descriptor.endsWith('?');
        let pipe = descriptor.includes('|');
        let tail = descriptor.slice(0, -1);
        if (star || plus || ques) {
            let value = tail;
            let fn = getter(value);
            return (token) => {
                let children = [];
                while (true) {
                    let child = fn(token.lexer, token);
                    if (child === null) {
                        break;
                    }
                    children.push(child);
                    if (ques) {
                        break;
                    }
                }
                if (ques) {
                    let [child = null] = children;
                    return token.finalize({child});
                }
                if (plus && children.length === 0) {
                    return null;
                }
                return token.finalize({children});
            };
        }
        if (pipe) {
            let fns = descriptor.split(' | ').map(getter);
            return (token) => {
                let child = null;
                let result = fns.some((fn) => {
                    child = fn(token.lexer, token);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return token.finalize({child});
            };
        }
        let fns = descriptor.split(' ').map(getter);
        return (token) => {
            let children = [];
            let assertion = false;
            let result = fns.every((fn) => {
                if (fn === '^') {
                    assertion = true;
                    return true;
                }
                let child = fn(token.lexer, token);
                children.push(child);
                return child !== null;
            });
            if (!result) {
                if (assertion) {
                    throw new Error;
                }
                return null;
            }
            return token.finalize({children});
        };
    }

    populateToken(name, gramRes = null) {
        let ctor = name.split('.').shift();
        let constructor = this.tokenConstructors[ctor] ?? this.defaultTokenContructor;
        let ctorRes = constructor.resolve ?? null;
        if (gramRes !== null && ctorRes !== null) {
            throw new InternalError;
        }
        let nullRes = () => null;
        let res = gramRes ?? ctorRes ?? nullRes;
        let resolve = (lexer, parent) => {
            let token = new constructor(key, lexer, parent);
            lexer.try(() => {
                token = res(token, this);
                return token !== null;
            });
            return token;
        };
        this.tokens[name] = resolve;
        return name;
    }

    tokenize(key, lexer) {
        return this.tokens[key](lexer, null);
    }
}
