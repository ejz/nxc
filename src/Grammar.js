import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';

// import AssemblerOperand from './tokens/AssemblerOperand.js';
// import End from './tokens/End.js';
import {
    SinglelineCommentBody,
    MultilineCommentBody,
} from './tokens/Sep.js';
/*Sep, */
//     Whitespace,
//     Comment,
//     SinglelineComment,
//     MultilineComment,
//     InlineSep,

import InternalError from './errors/InternalError.js';

// const isArray = Array.isArray;
// const toArray = (v) => isArray(v) ? v : [v];
const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    SinglelineCommentBody,
    MultilineCommentBody,
//     AssemblerOperand,
//     End,
//     Sep,
//     Whitespace,
//     Comment,
//     SinglelineComment,
//     MultilineComment,
//     InlineSep,
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
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        let n = 0;
        let additional = {};
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, descriptor] = pairs.slice(i);
            descriptor = descriptor.trim();
            descriptor = descriptor.replace(/\s+/g, ' ');
            descriptor = descriptor.replace(/`.*?`/g, (m) => {
                if (m.length === descriptor.length) {
                    return m;
                }
                let key = 'KeywordToken.' + (n++);
                additional[key] = m;
                return key;
            });
            descriptor = descriptor.replace(/'.*?'/g, (m) => {
                if (m.length === descriptor.length) {
                    return m;
                }
                let key = 'StringToken.' + (n++);
                return this.setTokenResolver(key, m);
            });
            descriptor = descriptor.replace(/\/.*?\/\w*/g, (m) => {
                if (m.length === descriptor.length) {
                    return m;
                }
                let key = 'RegexToken.' + (n++);
                additional[key] = m;
                return key;
            });
            descriptor = descriptor.replace(/\w+(\.\d+)?[*+?]/g, (m) => {
                if (m.length === descriptor.length) {
                    return m;
                }
                let name = m.endsWith('?') ? 'OptionalToken' : 'SequenceToken';
                let key = name + '.' + (n++);
                additional[key] = m;
                return key;
            });
            let changed = true;
            while (changed) {
                changed = false;
                descriptor = descriptor.replace(/\(\s*([^()]+?)\s*\)([*+?]?)/g, (m, p1, p2) => {
                    changed = true;
                    let key = 'ReferenceToken.' + (n++);
                    additional[key] = p1;
                    if (p2 === '') {
                        return key;
                    }
                    let name = p2 === '?' ? 'OptionalToken' : 'SequenceToken';
                    let newKey = name + '.' + (n++);
                    additional[newKey] = key + p2;
                    return newKey;
                });
            }
            this.setTokenResolver(name, descriptor);
            for (let key in additional) {
                let val = additional[key];
                this.setTokenResolver(key, val);
            }
            additional = {};
        }
    }

    setTokenResolver(key, descriptor) {
        let name = key.split('.').shift();
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        let ctorRes = ctor.resolve ?? null;
        if (
            (descriptor !== '!' && ctorRes !== null)
            || (descriptor === '!' && ctorRes === null)
        ) {
            throw new InternalError;
        }
        let res = ctorRes ?? this.getResolverFromDescriptor(descriptor);
        let resolver = (lexer) => {
            let obj;
            lexer.try(() => {
                obj = res(lexer, this);
                return obj !== null;
            });
            if (obj === null) {
                return null;
            }
            return new ctor(name).finalize(obj);
        };
        this.tokenResolvers[key] = resolver;
        this.tokenDescriptors[key] = descriptor;
        return key;
    }

    getTokenResolver(name) {
        let res = this.tokenResolvers[name];
        if (res === undefined) {
            throw new InternalError;
        }
        return res;
    }

    tokenize(name, lexer) {
        return this.getTokenResolver(name)(lexer);
    }

    getResolverFromDescriptor(descriptor) {
        if (descriptor.startsWith('\'')) {
            let string = eval(descriptor);
            return (lexer) => {
                let value = lexer.eat(string);
                return value !== null ? {value} : null;
            };
        }
        if (descriptor.startsWith('`')) {
            let keyword = descriptor.slice(1, -1);
            return (lexer) => {
                let value = lexer.eat(keyword);
                return value !== null ? {value} : null;
            };
        }
        if (descriptor.startsWith('/')) {
            let regex = eval(descriptor);
            return (lexer) => {
                let value = lexer.eatRegex(regex);
                return value !== null ? {value} : null;
            };
        }
        if (descriptor.includes('|')) {
            let parts = descriptor.split(' | ');
            let resolvers = null;
            return (lexer) => {
                resolvers ??= parts.map((part) => this.getTokenResolver(part));
                let child = null;
                let result = resolvers.some((resolver) => {
                    child = resolver(lexer);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return {child};
            };
        }
        if (descriptor.includes(' ')) {
            let parts = descriptor.split(' ');
            let resolvers = null;
            return (lexer) => {
                resolvers ??= parts.map((part) => {
                    return part === '^' ? part : this.getTokenResolver(part);
                });
                let assertion = false;
                let children = [];
                let result = resolvers.every((resolver) => {
                    if (resolver === '^') {
                        assertion = true;
                        return true;
                    }
                    let child = resolver(lexer);
                    children.push(child);
                    return child !== null;
                });
                if (!result) {
                    if (assertion) {
                        throw lexer.error();
                    }
                    return null;
                }
                return {children};
            };
        }
        let opti = descriptor.endsWith('?');
        if (opti) {
            let part = descriptor.slice(0, -1);
            let resolver = null;
            return (lexer) => {
                resolver ??= this.getTokenResolver(part);
                let child = resolver(lexer);
                return {child};
            };
        }
        let star = descriptor.endsWith('*');
        let plus = descriptor.endsWith('+');
        if (star || plus) {
            let part = descriptor.slice(0, -1);
            let resolver = null;
            return (lexer) => {
                resolver ??= this.getTokenResolver(part);
                let child, children = [];
                while (child !== null) {
                    child = resolver(lexer);
                    children.push(child);
                }
                children.pop();
                if (plus && children.length === 0) {
                    return null;
                }
                return {children};
            };
        }
        let part = descriptor;
        let resolver = null;
        return (lexer) => {
            resolver ??= this.getTokenResolver(part);
            let child = resolver(lexer);
            if (child === null) {
                return null;
            }
            return {child};
        };
    }
}
