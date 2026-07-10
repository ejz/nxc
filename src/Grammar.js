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
const nullResolver = () => null;
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
    ReferenceToken: 'ReferenceToken',
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
        console.log(this.tokenResolvers);
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
        let resolver = this.getResolverFromRule(name, rule);
        this.tokenResolvers[name] = resolver;
    }

    wrapResolver(name, resolver = nullResolver) {
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        console.log('wrapResolver', {name}, ctor, ctor.resolve);
        let res = ctor.resolve ?? resolver;
        return (lexer) => {
            let obj;
            lexer.try(() => {
                obj = res(lexer, this);
                return obj !== null;
            });
            if (obj === null) {
                return null;
            }
            console.log({obj});
            // console.log({ctor, name, obj});
            return new ctor(name).finalize(obj);
        };
    }

    getResolverFromRule(name, rule, resolvers) {
        // console.log(1, {rule, resolvers});
        let innerCall = resolvers !== undefined;
        resolvers = innerCall ? resolvers : [];
        let resolve = (part) => resolvers[part] ?? this.getTokenResolver(part);
        let resolveAssert = (part) => part === '^' ? part : resolve(part);
        let ret = (rule) => innerCall ? rule : resolve(rule);
        if (!innerCall) {
            rule = rule.trim();
            if (rule === '!') {
                return this.wrapResolver(name);
            }
            rule = rule.replace(/\s+/g, ' ');
            rule = rule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
                let [char] = m;
                let name, resolver;
                switch (char) {
                    case '`': {
                        let keyword = m.slice(1, -1);
                        name = SpecialToken.KeywordToken;
                        resolver = (lexer) => lexer.eat(keyword);
                        break;
                    }
                    case '\'': {
                        let string = eval(m);
                        name = SpecialToken.StringToken;
                        resolver = (lexer) => lexer.eat(string);
                        break;
                    }
                    case '/': {
                        let regex = eval(m);
                        name = SpecialToken.StringToken;
                        resolver = (lexer) => lexer.eatRegex(regex);
                        break;
                    }
                }
                resolver = this.wrapResolver(name, resolver);
                let key = resolvers.length;
                resolvers.push(resolver);
                return key;
            });
            let changed = true;
            while (changed) {
                changed = false;
                rule = rule.replace(/\( ?([^()]+?) ?\)/g, (m, p) => {
                    let name = SpecialToken.ReferenceToken;
                    changed = true;
                    return this.getResolverFromRule(name, p, resolvers);
                });
            }
        }
        {
            let optional = (part) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolve(part);
                    let child = resolver(lexer);
                    return child === null ? [] : [child];
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
                    return children;
                };
            };
            rule = rule.replace(/(\w+)([*+?])/g, (m, p1, p2) => {
                let plus = p2 === '+';
                let opti = p2 === '?';
                let name = opti ? SpecialToken.OptionalToken : SpecialToken.RepeatToken;
                let resolver = opti ? optional(p1) : repeat(p1, plus);
                resolver = this.wrapResolver(name, resolver);
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
                    return [child];
                };
            };
            let name = SpecialToken.ChoiceToken;
            let resolver = choice(parts);
            resolver = this.wrapResolver(name, resolver);
            let key = resolvers.length;
            resolvers.push(resolver);
            rule = key;
        } else if (rule.includes(' ')) {
            let parts = rule.split(' ');
            let sequence = (parts) => {
                let resolvers;
                return (lexer) => {
                    console.log({parts});
                    resolvers ??= parts.map(resolveAssert);
                    console.log({resolvers});
                    let assertion = false, children = [];
                    let result = resolvers.every((resolver) => {
                        if (resolver === '^') {
                            assertion = true;
                            return true;
                        }
                        let child = resolver(lexer);
                        console.log({child});
                        children.push(child);
                        return child !== null;
                    });
                    console.log({result});
                    if (!result) {
                        if (assertion) {
                            throw lexer.error();
                        }
                        return null;
                    }
                    return children;
                };
            };
            let name = SpecialToken.SequenceToken;
            let resolver = sequence(parts);
            resolver = this.wrapResolver(name, resolver);
            let key = resolvers.length;
            resolvers.push(resolver);
            rule = key;
        }
        if (innerCall) {
            return rule;
        }
        let resolver;
        return this.wrapResolver(name, (lexer) => {
            resolver ??= resolve(rule);
            let child = resolver(lexer);
            return child === null ? null : [child];
        });
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

    toAst(token, {parent = null, list = null, prev = null, next = null} = {}) {
        Object.assign(token, {parent, list, prev, next});
        if (token.children === undefined) {
            return;
        }
        parent = token;
        list = parent.children;
        list.forEach((child, i) => {
            let prev = list[i - 1] ?? null;
            let next = list[i + 1] ?? null;
            this.toAst(child, {parent, list, prev, next});
        });
    }

    shackle(ast) {
        //
    }


        // let getType = ({name}) => {
        //     return this.getDescriptorType(this.tokenDescriptors[name]);
        // };
        // // let type = ;
        // // console.log({type});
        // token.children.forEach((child) => {
        //     console.log({child});
        //     console.log(getType(child));
        // });
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
