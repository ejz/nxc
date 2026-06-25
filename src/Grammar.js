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
const eatRegex = (regex) => (token) => {
    let value = token.lexer.eatRegex(regex);
    if (value === null) {
        return null;
    }
    return token.finalize({value});
};

export default class Grammar {
    constructor({
        grammarFileContent = fs.readFileSync(grammarFile).toString(),
        defaultTokenContructor = Token,
        tokenConstructors = tokenCtors,
    } = {}) {
        this.grammarFileContent = grammarFileContent;
        this.defaultTokenContructor = defaultTokenContructor;
        this.tokenConstructors = tokenConstructors;
        this.tokenResolvers = {};
        this.tokenDescriptors = {};
        this.populateTokenResolvers();
    }

    populateTokenResolvers() {
        let content = this.grammarFileContent
            .split(/\n/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((line) => !line.startsWith('#'))
            .join('\n')
        ;
        let nameString = 0;
        let nameKeyword = 0;
        let references = {};
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, descriptor] = pairs.slice(i);
            descriptor = descriptor.trim();
            if (descriptor === '!') {
                this.setTokenResolver(name, null, descriptor);
                continue;
            }
            if (descriptor.startsWith('/^') && descriptor.endsWith('/')) {
                let regex = eval(descriptor);
                this.setTokenResolver(name, eatRegex(regex), descriptor);
                continue;
            }
            descriptor = descriptor.replace(/'.*?'/g, (m) => {
                let string = eval(m);
                let name = 'String.' + (nameString++);
                return this.setTokenResolver(name, eatValue(string), m);
            });
            descriptor = descriptor.replace(/`(.*?)`/g, (m, p) => {
                let name = 'Keyword.' + (nameKeyword++);
                return this.setTokenResolver(name, eatValue(p), m);
            });
            descriptor = descriptor.replace(/\s+/g, ' ');
            let des = this.dereferenceTokenDescriptor(descriptor, references);
            let res = this.castDescriptorToResolver(des);
            this.setTokenResolver(name, res, des);
        }
        for (let name in references) {
            let des = references[name];
            let res = this.castDescriptorToResolver(des);
            this.setTokenResolver(name, res, des);
        }
    }

    dereferenceTokenDescriptor(descriptor, references) {
        let changed = false;
        let toReference = (des) => {
            changed = true;
            let name = 'Reference.' + Object.keys(references).length;
            references[name] = des;
            return name;
        };
        descriptor = descriptor.replace(/[^\s()]+[*+?]/g, (m) => {
            if (m.length === descriptor.length) {
                return m;
            }
            return toReference(m);
        });
        descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
            return toReference(p);
        });
        return changed ? this.dereferenceTokenDescriptor(descriptor, references) : descriptor;
    }

    castDescriptorToResolver(descriptor) {
        let star = descriptor.endsWith('*');
        let plus = descriptor.endsWith('+');
        let ques = descriptor.endsWith('?');
        let pipe = descriptor.includes('|');
        let tail = descriptor.slice(0, -1);
        if (star || plus || ques) {
            let name = tail;
            let resolver = null;
            return (token) => {
                let children = [];
                resolver ??= this.getTokenResolver(name);
                while (true) {
                    let child = resolver(token.lexer, token);
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
            let names = descriptor.split(' | ');
            let resolvers = null;
            return (token) => {
                let child = null;
                resolvers ??= names.map((name) => this.getTokenResolver(name));
                let result = resolvers.some((fn) => {
                    child = fn(token.lexer, token);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return token.finalize({child});
            };
        }
        let names = descriptor.split(' ');
        let resolvers = null;
        return (token) => {
            let children = [];
            let assertion = false;
            resolvers ??= names.map((name) => {
                return name === '^' ? name : this.getTokenResolver(name);
            });
            let result = resolvers.every((fn) => {
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
                    throw token.lexer.error();
                }
                return null;
            }
            return token.finalize({children});
        };
    }

    setTokenResolver(name, res, des) {
        let ctor = name.split('.').shift();
        let constructor = this.tokenConstructors[ctor] ?? this.defaultTokenContructor;
        let nullRes = () => null;
        let ctorRes = constructor.resolve ?? null;
        if (res !== null && ctorRes !== null) {
            throw new InternalError;
        }
        res ??= ctorRes ?? nullRes;
        let resolver = (lexer, parent) => {
            let token = new constructor(name, lexer, parent);
            lexer.try(() => {
                token = res(token, this);
                return token !== null;
            });
            return token;
        };
        this.tokenResolvers[name] = resolver;
        this.tokenDescriptors[name] = des;
        return name;
    }

    getTokenResolver(name) {
        let res = this.tokenResolvers[name];
        if (res === undefined) {
            throw new InternalError;
        }
        return res;
    }

    tokenize(name, lexer, parent = null) {
        return this.getTokenResolver(name)(lexer, parent);
    }
}
