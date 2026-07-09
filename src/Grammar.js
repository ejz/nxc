import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';

import AssemblerOperand from './tokens/AssemblerOperand.js';
import End from './tokens/End.js';
import Sep, {
    Whitespace,
    Comment,
    SinglelineComment,
    MultilineComment,
    SinglelineCommentBody,
    MultilineCommentBody,
    InlineSep,
} from './tokens/Sep.js';

import InternalError from './errors/InternalError.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    AssemblerOperand,
    End,
    Sep,
    Whitespace,
    Comment,
    SinglelineComment,
    MultilineComment,
    SinglelineCommentBody,
    MultilineCommentBody,
    InlineSep,
};
const SpecialToken = {
    KeywordToken: 'KeywordToken',
    StringToken: 'StringToken',
    OptionalToken: 'OptionalToken',
    RepeatToken: 'RepeatToken',
    ChoiceToken: 'ChoiceToken',
    SequenceToken: 'SequenceToken',
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
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, rule] = pairs.slice(i);
            this.setTokenResolver(name, rule);
        }
    }

    setTokenResolver(name, rule) {
        let getter = () => this.getResolverFromRule(rule);
        this.tokenResolvers[name] = this.wrapResolver(name, getter);
    }

    wrapResolver(name, getter) {
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        let res = ctor.resolve;
        return (lexer) => {
            let obj;
            res ??= getter();
            lexer.try(() => {
                obj = res(lexer, this);
                return obj !== null;
            });
            if (obj === null) {
                return null;
            }
            return new ctor(name).finalize(obj);
        };
    }

    // (rule, resolve) {
    //     // let resolve = (part) => resolvers[part] ?? this.getTokenResolver(part);
    //     let resolveAssert = 
    
    
        
    //     let resolver, part = rule;
    //     return (lexer) => {
    //         resolver ??= resolve(part);
    //         let child = resolver(lexer);
    //         if (child === null) {
    //             return null;
    //         }
    //         return {children: [child]};
    //     };
    // }

    getResolverFromRule(rule, resolvers) {
        console.log(1, {rule, resolvers});
        let innerCall = resolvers !== undefined;
        resolvers = innerCall ? resolvers : [];
        let resolve = (part) => resolvers[part] ?? this.getTokenResolver(part);
        let resolveAssert = (part) => part === '^' ? part : resolve(part);
        let ret = (rule) => innerCall ? rule : resolve(rule);
        if (!innerCall) {
            rule = rule.trim();
            rule = rule.replace(/\s+/g, ' ');
            rule = rule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
                let [char] = m;
                let name, getter;
                switch (char) {
                    case '`': {
                        let keyword = m.slice(1, -1);
                        name = SpecialToken.KeywordToken;
                        getter = (lexer) => {
                            let value = lexer.eat(keyword);
                            return value !== null ? {value} : null;
                        };
                    }
                    case '\'': {
                        let string = eval(m);
                        name = SpecialToken.StringToken;
                        getter = (lexer) => {
                            let value = lexer.eat(string);
                            return value !== null ? {value} : null;
                        };
                    }
                    case '/': {
                        let regex = eval(m);
                        name = SpecialToken.StringToken;
                        return (lexer) => {
                            let value = lexer.eatRegex(regex);
                            return value !== null ? {value} : null;
                        };
                    }
                }
                let resolver = this.wrapResolver(name, getter);
                let key = resolvers.length;
                resolvers.push(resolver);
                return key;
            });
            let changed = true;
            while (changed) {
                changed = false;
                rule = rule.replace(/\( ?([^()]+?) ?\)/g, (m, p) => {
                    changed = true;
                    return this.getResolverFromRule(p, resolvers);
                });
            }
        }
        console.log(2, {rule, resolvers});
        {
            let optional = (part) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolve(part);
                    let child = resolver(lexer);
                    return {children: child === null ? [] : [child]};
                };
            };
            let repeat = (part, plus) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolve(part);
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
            };
            rule = rule.replace(/(\w+)([*+?])/g, (m, p1, p2) => {
                let plus = p2 === '+';
                let opti = p2 === '?';
                let name = opti ? SpecialToken.OptionalToken : SpecialToken.RepeatToken;
                let getter = opti ? optional(p1) : repeat(p1, plus);
                let resolver = this.wrapResolver(seq, getter);
                let key = resolvers.length;
                resolvers.push(resolver);
                return key;
            });
        }
        if (rule.includes('|')) {
            let parts = rule.split(' | ');
            let choice = (parts) => {
                let resolvers;
                return (lexer) => {
                    resolvers ??= parts.map(resolve);
                    let child, result = resolvers.some((resolver) => {
                        child = resolver(lexer);
                        return child !== null;
                    });
                    if (!result) {
                        return null;
                    }
                    return {children: [child]};
                };
            };
            let name = SpecialToken.ChoiceToken;
            let getter = choice(parts);
            let resolver = this.wrapResolver(name, getter);
            let key = resolvers.length;
            resolvers.push(resolver);
            return ret(key);
        }
        let parts = rule.split(' ');
        let sequence = (parts) => {
            let resolvers;
            return (lexer) => {
                resolvers ??= parts.map(resolveAssert);
                let assertion = false, children = [];
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
        };
        let name = SpecialToken.SequenceToken;
        let getter = sequence(parts);
        let resolver = this.wrapResolver(name, getter);
        let key = resolvers.length;
        resolvers.push(resolver);
        return ret(key);
        // let seq = SpecialToken.SequenceToken;
        // let ref = SpecialToken.ReferenceToken;
        // let empt = p2 === '';
        // let plus = p2 === '+';
        // let opti = p2 === '?';
        // if (empt) {
        //     let getter = m.endsWith('?') ? optional(p) : sequence(p, m.endsWith('+'));
        //     let resolver = this.wrapResolver(name, getter);
        //     let key = resolvers.length;
        //     resolvers.push(resolver);
        //     return key;
        // }
        // let name = 'ReferenceToken';
        // let key = resolvers.length;
        // let resolver = 
        // resolvers.push(resolver);
        // let key = SpecialToken.ReferenceToken + (n++);
        // additional[key] = p1;
        // if (p2 === '') {
        //     return key;
        // }
        // let name = p2 === '?' ? 'OptionalToken' : 'SequenceToken';
        // let newKey = name + '.' + (n++);
        // additional[newKey] = key + p2;
        // return newKey;
    }


    getTokenResolver(name) {
        let res = this.tokenResolvers[name];
        console.log({name});
        if (res === undefined) {
            throw new InternalError;
        }
        return res;
    }

    tokenize(name, lexer) {
        return this.getTokenResolver(name)(lexer);
    }

    buildAst(token, {parent = null, list = null, prev = null, next = null} = {}) {
        Object.assign(token, {parent, list, prev, next});
        if (token.children === undefined) {
            return;
        }
        let getType = ({name}) => {
            return this.getDescriptorType(this.tokenDescriptors[name]);
        };
        // let type = ;
        // console.log({type});
        token.children.forEach((child) => {
            console.log({child});
            console.log(getType(child));
        });
        // token.parent = parent;
        // token.list = list;
        // token.prev = prev;
        // token.next = next;
        // let children = token.children;
        // let node = {
        //     token,
        //     parent,
        //     list,
        //     prev,
        //     next,
        //     nodes: null,
        // };
    }
}
