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
    AssemblerOperand,
    End,
    SameLineSep,
};
const eatValueClosure = (value) => (token) => token.lexer.eat(value) ? token.finalize({value}) : null;
const eatRegexClosure = (regex) => (token) => {
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
            res ??= this.castDescriptorToResolver(descriptor);
            let obj;
            // console.log({lexer, parent});
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
        let changed = false;
        descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
            let ref = 'ref.' + Object.keys(refs).length;
            // let res = ;
            refs[ref] = this.castDescriptorToResolver(p, refs);
            // (lexer) => {
            //     return res(lexer);
            //     // lexer, parent
            //     // console.log({t});
            // };
            // console.log({m, p});
            changed = true;
            return ref;
            // return toReference(p);
        });
        if (changed) {
            // console.log({descriptor, refs});
            return this.castDescriptorToResolver(descriptor, refs);
        }
        let isDisjunction = descriptor.includes('|');
        let isConjunction = !isDisjunction && descriptor.includes(' ');
        isDisjunction = !isConjunction;
        // console.log({descriptor});
        if (isDisjunction) {
            let parts = descriptor.split(' | ');
            // console.log({parts});
            let resolvers = null;
            return (lexer) => {
                let child = null;
                resolvers ??= parts.map((part) => {
                    let ref = refs[part];
                    if (ref !== undefined) {
                        return ref;
                    }
                    // console.log({part}, refs);
                    // if (refs[part]) {
                    //     return refs[part];() => {
                    //         return refs[part](token.lexer, token);
                    //     };
                    // }
                    // console.log('getPartResolver', part, this.getPartResolver(part));
                    return this.getPartResolver(part);
                });
                console.log(resolvers);
                let result = resolvers.some((fn, i) => {
                    console.log({fn, i, token});
                    child = fn(lexer);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return token.finalize({child});
            };
        }
        // let names = descriptor.split(' ');
        // let resolvers = null;
        // return (token) => {
        //     let children = [];
        //     let assertion = false;
        //     resolvers ??= names.map((name) => {
        //         return name === '^' ? name : this.getTokenResolver(name);
        //     });
        //     let result = resolvers.every((fn) => {
        //         if (fn === '^') {
        //             assertion = true;
        //             return true;
        //         }
        //         let child = fn(token.lexer, token);
        //         children.push(child);
        //         return child !== null;
        //     });
        //     if (!result) {
        //         if (assertion) {
        //             throw token.lexer.error();
        //         }
        //         return null;
        //     }
        //     return token.finalize({children});
        // };
        throw new InternalError;
    }

    getPartResolver(value) {
        if (value.startsWith('/^') && value.endsWith('/')) {
            let regex = eval(value);
            let res = eatRegexClosure(regex);
            let name = 'RegexToken';
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            let ctorRes = ctor.resolve ?? null;
            if (ctorRes !== null) {
                throw new InternalError;
            }
            return (lexer, parent) => {
                let token = new ctor(name, lexer, parent);
                return res(token);
            };
        }
        if (value.startsWith('\'') && value.endsWith('\'')) {
            let string = eval(value);
            let res = eatValueClosure(string);
            let name = 'StringToken';
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            let ctorRes = ctor.resolve ?? null;
            if (ctorRes !== null) {
                throw new InternalError;
            }
            return (lexer, parent) => {
                let token = new ctor(name, lexer, parent);
                return res(token);
            };
        }
        if (value.startsWith('`') && value.endsWith('`')) {
            let keyword = value.slice(1, -1);
            let res = eatValueClosure(keyword);
            let name = 'KeywordToken';
            let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
            let ctorRes = ctor.resolve ?? null;
            if (ctorRes !== null) {
                throw new InternalError;
            }
            return (lexer, parent) => {
                let token = new ctor(name, lexer, parent);
                return res(token);
            };
        }
        console.log({value});
        return this.getTokenResolver(value);
        // descriptor = descriptor.replace(/`(.*?)`/g, (m, p) => {
        //     let name = 'Keyword.' + (nameKeyword++);
        //     return this.setTokenResolver(name, eatValue(p), m);
        // });
        // let tokenResolver = 
        // this.setTokenResolver(name, , value);
        // continue;
        // descriptor = descriptor.replace(/'.*?'/g, (m) => {
        //     let string = eval(m);
        //     let name = 'String.' + (nameString++);
        //     return this.setTokenResolver(name, eatValue(string), m);
        // });
    }
}

// dereferenceTokenDescriptor(descriptor, references) {
//     let changed = false;
//     let toReference = (des) => {
//         changed = true;
//         let name = 'Reference.' + Object.keys(references).length;
//         references[name] = des;
//         return name;
//     };
//     descriptor = descriptor.replace(/[^\s()]+[*+?]/g, (m) => {
//         if (m.length === descriptor.length) {
//             return m;
//         }
//         return toReference(m);
//     });
//     descriptor = descriptor.replace(/\(\s*([^()]*?)\s*\)/g, (m, p) => {
//         return toReference(p);
//     });
//     return changed ? this.dereferenceTokenDescriptor(descriptor, references) : descriptor;
// }

// castDescriptorToResolver(descriptor) {
//     let star = descriptor.endsWith('*');
//     let plus = descriptor.endsWith('+');
//     let ques = descriptor.endsWith('?');
//     let pipe = descriptor.includes('|');
//     let tail = descriptor.slice(0, -1);
//     if (star || plus || ques) {
//         let name = tail;
//         let resolver = null;
//         return (token) => {
//             let children = [];
//             resolver ??= this.getTokenResolver(name);
//             while (true) {
//                 let child = resolver(token.lexer, token);
//                 if (child === null) {
//                     break;
//                 }
//                 children.push(child);
//                 if (ques) {
//                     break;
//                 }
//             }
//             if (ques) {
//                 let [child = null] = children;
//                 return token.finalize({child});
//             }
//             if (plus && children.length === 0) {
//                 return null;
//             }
//             return token.finalize({children});
//         };
//     }
//     if (pipe) {
//         let names = descriptor.split(' | ');
//         let resolvers = null;
//         return (token) => {
//             let child = null;
//             resolvers ??= names.map((name) => this.getTokenResolver(name));
//             let result = resolvers.some((fn) => {
//                 child = fn(token.lexer, token);
//                 return child !== null;
//             });
//             if (!result) {
//                 return null;
//             }
//             return token.finalize({child});
//         };
//     }

// }

// let isConjunction = descriptor.includes(' ');

//
/*
if (!descriptor.includes(' ')) {
}
if (descriptor === '!') {
    this.setTokenResolver(name, null, descriptor);
    continue;
}

let des = this.dereferenceTokenDescriptor(descriptor, references);
let res = this.castDescriptorToResolver(des);
this.setTokenResolver(name, res, des);
for (let name in references) {
    let des = references[name];
    let res = this.castDescriptorToResolver(des);
    this.setTokenResolver(name, res, des);
}
*/
// let isConjunction = descriptor.includes(' ');
// if (!isConjunction) {
//     let parts = descriptor.split(' | ');
//     let resolvers = null;
//     return (token) => {
//         let child = null;
//         resolvers ??= parts.map((name) => this.getTokenResolver(name));
//         let result = resolvers.some((fn) => {
//             child = fn(token.lexer, token);
//             return child !== null;
//         });
//         if (!result) {
//             return null;
//         }
//         return token.finalize({child});
//     };
// }
//
/*
if (!descriptor.includes(' ')) {
}
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
let des = this.dereferenceTokenDescriptor(descriptor, references);
let res = this.castDescriptorToResolver(des);
this.setTokenResolver(name, res, des);
for (let name in references) {
    let des = references[name];
    let res = this.castDescriptorToResolver(des);
    this.setTokenResolver(name, res, des);
}
*/