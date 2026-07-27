import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import AssemblerStatement from './tokens/AssemblerStatement.js';
import InlineSep from './tokens/InlineSep.js';
import InternalError from './errors/InternalError.js';

const isArray = Array.isArray;
const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    InlineSep,
    AssemblerBlock,
    AssemblerStatement,
};
const SpecialToken = {
    KeywordToken: 'KeywordToken',
    StringToken: 'StringToken',
    OptionalToken: 'OptionalToken', // a?
    RepeatToken: 'RepeatToken', // a*
    ChoiceToken: 'ChoiceToken', // a | b
    SequenceToken: 'SequenceToken', // a b
    GreedyToken: 'GreedyToken', // * a
    LookupToken: 'LookupToken', // ?a
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
        let resolvers = [];
        let originalPush = resolvers.push.bind(resolvers);
        resolvers.push = (element) => {
            let key = resolvers.length;
            originalPush(element);
            return key;
        };
        resolvers.doResolve = (part) => resolvers[part] ?? this.getTokenResolver(part);
        resolvers.doResolveSpecial = (part) => ['^', '*'].includes(part) ? part : resolvers.doResolve(part);
        rule = rule.trim();
        rule = rule.replace(/\s+/g, ' ');
        rule = rule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
            let [char] = m;
            switch (char) {
                case '`': {
                    let keyword = m.slice(1, -1);
                    let name = SpecialToken.KeywordToken;
                    let resolver = (lexer) => lexer.eat(keyword);
                    resolver = this.wrapResolver(name, resolver);
                    return resolvers.push(resolver);
                }
                case '\'': {
                    let string = eval(m);
                    let name = SpecialToken.StringToken;
                    let resolver = (lexer) => lexer.eat(string);
                    resolver = this.wrapResolver(name, resolver);
                    return resolvers.push(resolver);
                }
                case '/': {
                    let regex = eval(m);
                    let name = SpecialToken.StringToken;
                    let resolver = (lexer) => lexer.eatRegex(regex);
                    resolver = this.wrapResolver(name, resolver);
                    return resolvers.push(resolver);
                }
            }
        });
        let changed = true;
        while (changed) {
            changed = false;
            rule = rule.replace(/\( ?([^()]+?) ?\)/g, (m, p) => {
                changed = true;
                return this.getResolverFromRule(p, resolvers);
            });
        }
        rule = this.getResolverFromRule(rule, resolvers);
        let wrapResolver;
        let resolver = this.wrapResolver(name, (lexer) => {
            wrapResolver ??= resolvers.doResolve(rule);
            let child = wrapResolver(lexer);
            return child === null ? null : [child];
        });
        this.tokenResolvers[name] = resolver;
    }

    wrapResolver(name, resolver) {
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        let res = ctor.resolve ?? resolver;
        return (lexer) => {
            let value;
            let start = lexer.position;
            lexer.try(() => {
                value = res(lexer);
                return value !== null;
            });
            if (value === null) {
                return null;
            }
            let token = new ctor(name);
            token.start = start;
            token.lexer = lexer;
            token.grammar = this;
            token.end = lexer.position;
            if (isArray(value)) {
                token.children = value;
            } else {
                token.value = value;
            }
            if (token.preValidate !== undefined && !token.preValidate()) {
                return null;
            }
            return token;
        };
    }

    getResolverFromRule(rule, resolvers) {
        {
            let optional = (part) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolvers.doResolve(part);
                    let child = resolver(lexer);
                    return child === null ? [] : [child];
                };
            };
            let repeat = (part, plus) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolvers.doResolve(part);
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
                return resolvers.push(resolver);
            });
        }
        {
            let lookup = (part) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolvers.doResolve(part);
                    let res = lexer.look(() => resolver(lexer));
                    return res !== null ? [] : null;
                };
            };
            rule = rule.replace(/\?(\w+)/g, (m, p1) => {
                let name = SpecialToken.LookupToken;
                let resolver = lookup(p1);
                resolver = this.wrapResolver(name, resolver);
                return resolvers.push(resolver);
            });
        }
        if (rule.includes('|')) {
            let parts = rule.split(' | ');
            let choice = (parts) => {
                let resolver;
                return (lexer) => {
                    resolver ??= parts.map((part) => {
                        return resolvers.doResolve(part);
                    });
                    let child, result = resolver.some((resolver) => {
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
            return resolvers.push(resolver);
        }
        let parts = rule.split(' ');
        if (parts.length === 1 && rule !== '*') {
            return rule;
        }
        let sequence = (parts) => {
            let resolver;
            return (lexer) => {
                resolver ??= parts.map((part) => {
                    return resolvers.doResolveSpecial(part);
                });
                let assertion = false, children = [];
                let greedy = null;
                let result = resolver.every((resolver, i) => {
                    if (resolver === '*') {
                        let name = SpecialToken.GreedyToken;
                        let token = this.wrapResolver(name, () => '')(lexer);
                        children.push(token);
                        greedy = token;
                        return true;
                    }
                    if (resolver === '^') {
                        assertion = true;
                        return true;
                    }
                    let lastRet;
                    let ret = () => {
                        let child = resolver(lexer);
                        if (child === null) {
                            lastRet = false;
                            return lastRet;
                        }
                        children.push(child);
                        lastRet = true;
                        return lastRet;
                    };
                    if (greedy === null) {
                        return ret();
                    }
                    while (!ret()) {
                        let character = lexer.eatCharacter();
                        if (character === null) {
                            break;
                        }
                        greedy.value += character;
                    }
                    greedy = null;
                    return lastRet;
                });
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
        return resolvers.push(resolver);
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
        // if (token !== null) {
        //     token = this.toAst(token, parent);
        //     token = this.shackle(token);
        // }
        // return token;
    }

    toAst(token, parent = null, calls) {
        let topCall = calls === undefined;
        calls ??= [];
        token.parent = parent;
        if (token.postValidate !== undefined) {
            calls.push(() => token.postValidate());
        }
        let list = token.children ?? [];
        list.forEach((child) => {
            this.toAst(child, token, calls);
        });
        if (topCall) {
            calls.forEach((call) => call());
        }
        return token;
    }

    shackle(ast) {
        let filter = (token) => {
            return [
                'OptionalToken',
                'RepeatToken',
                'ChoiceToken',
                'SequenceToken',
                'LookupToken',
            ].includes(token.name);
        };
        let tokens = ast.filter(filter);
        tokens.forEach((token) => {
            token.unwrap();
        });
        return ast;
    }
}

// function toPredicate(predicate) {
//     let parts = predicate.split(',');
//     let predicates = parts.map(toPredicatePart);
//     return (token) => predicates.every((predicate) => predicate(token));
// }

// function toPredicatePart(part) {
//     let negate = part.startsWith('!');
//     part = negate ? part.slice(1) : part;
//     let fn, arg = null;
//     let idx = part.indexOf('=');
//     if (idx !== -1) {
//         arg = part.slice(idx + 1);
//         part = part.slice(0, idx + 1);
//     }
//     switch (part) {
//         case 'isEmpty': {
//             fn = isEmpty;
//             break;
//         }
//         case 'isPrimary': {
//             fn = isPrimary;
//             break;
//         }
//         case 'hasPrimary': {
//             fn = hasPrimary;
//             break;
//         }
//         case 'parent=': {
//             fn = withParent(arg);
//             break;
//         }
//         case 'parent.parent=': {
//             fn = withParentParent(arg);
//             break;
//         }
//         default: throw new InternalError;
//     }
//     return (token) => {
//         let res = fn(token);
//         return (!negate && res) || (negate && !res);
//     };
// }
// ConditionalToken: 'ConditionalToken',
// const isPrimary = (token) => token.is('StringToken', 'KeywordToken', 'Sep');
// const isEmpty = (token) => token.children.length === 0;
// const hasPrimary = (token) => token.children.filter(isPrimary).length !== 0;
// const withParent = (arg) => (token) => token.parent.is(arg);
// const withParentParent = (arg) => (token) => token.parent.parent.is(arg);