import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
// import Comment from './tokens/Comment.js';
// import Whitespace from './tokens/Whitespace.js';
// import SinglelineComment from './tokens/SinglelineComment.js';
// import SinglelineCommentBody from './tokens/SinglelineCommentBody.js';
// import MultilineComment from './tokens/MultilineComment.js';
// import MultilineCommentBody from './tokens/MultilineCommentBody.js';
// import Sep from './tokens/Sep.js';
// import AssemblerOperand from './tokens/AssemblerOperand.js';
// import End from './tokens/End.js';
// import SameLineSep from './tokens/SameLineSep.js';

import InternalError from './errors/InternalError.js';

const isArray = Array.isArray;
const toArray = (v) => isArray(v) ? v : [v];
const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    // Comment,
    // Whitespace,
    // SinglelineComment,
    // SinglelineCommentBody,
    // MultilineComment,
    // MultilineCommentBody,
    // Sep,
    // AssemblerOperand,
    // End,
    // SameLineSep,
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
            descriptor = descriptor.replace(/\s+/g, ' ');
            this.setTokenResolver(name, descriptor);
        }
    }

    setTokenResolver(name, descriptor) {
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        let ctorRes = ctor.resolve ?? null;
        if (
            (descriptor !== '!' && ctorRes !== null)
            || (descriptor === '!' && ctorRes === null)
        ) {
            throw new InternalError;
        }
        let res = ctorRes;
        let resolver = (lexer) => {
            let obj;
            res ??= this.castDescriptorToResolver(descriptor);
            lexer.try(() => {
                obj = res(lexer);
                return obj !== null;
            });
            if (obj === null) {
                return null;
            }
            return new ctor(name).finalize(obj);
        };
        this.tokenResolvers[name] = resolver;
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

    castDescriptorToResolver(descriptor, refs = {}) {
        let getPart = (opts = null) => (part, i) => {
            let got = opts !== null;
            let star = got && part.endsWith('*');
            let plus = got && part.endsWith('+');
            let opti = got && part.endsWith('?');
            part = (star || plus || opti) ? part.slice(0, -1) : part;
            if (got) {
                opts[i] = {star, plus, opti};
            }
            return refs[part] ?? this.getValueTokenResolver(part) ?? this.getTokenResolver(part);
        };
        let changed = false;
        descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
            let ref = 'ref.' + Object.keys(refs).length;
            let res = this.castDescriptorToResolver(p, refs);
            refs[ref] = (lexer) => {
                let r = res(lexer);
                return r !== null ? (r.child ?? r.children) : null;
            };
            changed = true;
            return ref;
        });
        if (changed) {
            return this.castDescriptorToResolver(descriptor, refs);
        }
        let isDisjunction = descriptor.includes('|');
        let isConjunction = !isDisjunction && descriptor.includes(' ');
        if (!isConjunction) {
            let parts = descriptor.split(' | ');
            let resolvers = parts.map(getPart());
            return (lexer) => {
                let child = null;
                let result = resolvers.some((fn, i) => {
                    child = fn(lexer);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return {child};
            };
        }
        let parts = descriptor.split(' ');
        let opts = parts.map(() => ({}));
        let resolvers = parts.map(getPart(opts));
        return (lexer) => {
            let children = [];
            let result = resolvers.every((fn, i) => {
                let {star, plus, opti} = opts[i];
                let min = star || opti ? 0 : 1;
                let max = star || plus ? Infinity : 1;
                // star - 0 Inf
                // plus - 1 Inf
                // opti - 0 1
                // defa - 1 1
                let collect = [];
                while (true) {
                    let child = fn(lexer);
                    if (child === null) {
                        break;
                    }
                    collect.push(...toArray(child));
                    if (collect.length === max) {
                        break;
                    }
                }
                children.push(...collect);
                return collect.length >= min;
            });
            if (!result) {
                return null;
            }
            return {children};
        };
    }

    getValueTokenResolver(value) {
        if (value.startsWith('/') && value.endsWith('/')) {
            let name = 'RegexToken';
            let regex = eval(value);
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            return (lexer) => {
                let value = lexer.eatRegex(regex);
                return value !== null ? new ctor(name).finalize({value}) : null;
            };
        }
        if (value.startsWith('\'') && value.endsWith('\'')) {
            let name = 'StringToken';
            let string = eval(value);
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            return (lexer) => {
                let value = lexer.eat(string) ? string : null;
                return value !== null ? new ctor(name).finalize({value}) : null;
            };
        }
        if (value.startsWith('`') && value.endsWith('`')) {
            let name = 'KeywordToken';
            let keyword = value.slice(1, -1);
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            return (lexer) => {
                let value = lexer.eat(keyword) ? keyword : null;
                return value !== null ? new ctor(name).finalize({value}) : null;
            };
        }
        return null;
    }
}
