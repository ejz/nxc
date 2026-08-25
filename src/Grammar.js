import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import AssemblerStatement from './tokens/AssemblerStatement.js';
import InlineSep from './tokens/InlineSep.js';
import InternalError from './errors/InternalError.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    InlineSep,
    AssemblerBlock,
    AssemblerStatement,
};
// const SpecialToken = {
//     // KeywordToken: 'KeywordToken',
//     // StringToken: 'StringToken',
//     // RegexToken: 'RegexToken',
//     OptionalToken: 'OptionalToken', // a?
//     RepeatToken: 'RepeatToken', // a*
//     ChoiceToken: 'ChoiceToken', // a | b
//     SequenceToken: 'SequenceToken', // a b
//     GreedyToken: 'GreedyToken', // * a
//     LookupToken: 'LookupToken', // ?a
// };
const onTokenOkayDefault = (ctx, token) => {
    console.log(
        '%s [okay] start = %s, %j',
        ctx.join(' -> '),
        token.start,
        token.lexer.content.slice(token.start, token.end),
    );
};
const onTokenFailDefault = (ctx) => {
    console.log('%s [fail]', ctx.join(' -> '));
};

export default class Grammar {
    constructor({
        grammarFileContent = fs.readFileSync(grammarFile).toString(),
        defaultTokenContructor = Token,
        tokenConstructors = tokenCtors,
        onTokenOkay = onTokenOkayDefault,
        onTokenFail = onTokenFailDefault,
    } = {}) {
        this.grammarFileContent = grammarFileContent;
        this.defaultTokenContructor = defaultTokenContructor;
        this.tokenConstructors = tokenConstructors;
        this.tokenResolvers = {};
        this.onTokenOkay = onTokenOkay;
        this.onTokenFail = onTokenFail;
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
            rule = rule.trim();
            rule = rule.replace(/\s+/g, ' ');
            this.tokenResolvers[name] = {rule, resolver: null};
        }
    }

    #factoryGetter(name, customCtor = false) {
        let ctors = customCtor ? this.tokenConstructors : {};
        let ctor = ctors[name] ?? this.defaultTokenContructor;
        return (lexer) => new ctor(name, lexer, this);
    }

    // let factoryGetter = (name, tokenCtor = false) => {
    //     
    // };

    #getTokenResolver(name, ctx) {
        let newCtx = (elem) => {
            let copy = Array.from(ctx);
            copy.push(elem);
            return copy;
        };
        // console.log({name});
        let {rule} = this.tokenResolvers[name];
        // console.log({rule});
        // Token1 -> Token2 -> `1` [x]
        // Token1 -> Token2 -> `a` [v] "a"
        // Token1 -> Token2 [v] "a"
        // Token1 [v] "ab"
        
        let resolvers = [];
        let originalPush = resolvers.push.bind(resolvers);
        resolvers.push = (element) => {
            let key = resolvers.length;
            originalPush(element);
            return key;
        };
        resolvers.getTokenResolver = (rule) => resolvers[rule] ?? this.#getTokenResolver(rule, newCtx(rule));
        resolvers.getTokenResolverSpecial = (rule) => ['^', '*'].includes(rule) ? rule : resolvers.getTokenResolver(rule);
        // this.getTokenResolver(rule, resolvers);
        // ref ??= 
        // resolvers[part] ?? ;
        rule = rule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
            let [char] = m;
            let name, resolver;
            switch (char) {
                case '`': {
                    let keyword = m.slice(1, -1);
                    resolver = (lexer) => lexer.eat(keyword);
                    name = 'KeywordToken';
                    break;
                }
                case '\'': {
                    let string = eval(m);
                    resolver = (lexer) => lexer.eat(string);
                    name = 'StringToken';
                    break;
                }
                case '/': {
                    let regex = eval(m);
                    resolver = (lexer) => lexer.eatRegex(regex);
                    name = 'RegexToken';
                    break;
                }
            }
            let ctx = newCtx(m);
            let factory = this.#factoryGetter(name);
            resolver = this.wrapResolver(factory, resolver, ctx);
            return resolvers.push(resolver);
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
        let ref, resolver = (lexer) => {
            // this.getTokenResolver(rule, resolvers);
            ref ??= resolvers.getTokenResolver(rule);
            // [rule] ?? this.#getTokenResolver(rule, newCtx(ctx, rule));
            let child = ref(lexer);
            return child === null ? null : [child];
        };
        let factory = this.#factoryGetter(name, true);
        resolver = this.wrapResolver(factory, resolver, ctx);
        return resolver;
        // this.tokenResolvers[name] = [factory, resolver];
        // resolvers.doResolve(rule);
        // this.wrapResolver(name, (lexer) => {
        //     subResolver ??= resolvers.doResolve(rule);
        // });
    }

    getTokenResolver(name) {
        let ref = this.tokenResolvers[name];
        return ref.resolver ??= this.#getTokenResolver(name, [name]);
        // let [factory, resolver] = resolvers[name] ?? this.tokenResolvers[name];
        // resolver = this.wrapResolver(factory, resolver);
        // return resolver;
        // resolvers = [], special = ['^', '*']
        // let res = resolvers[part] ?? this.getTokenResolver(part);
        // resolvers.doResolve = (part) => ;
        // resolvers.doResolveSpecial = (part) => ;
        // let res = this.tokenResolvers[name];
        // return (lexer) => res(lexer, context);
        // if (res === undefined) {
        //     throw new InternalError;
        // }
        // let [factory, caller] = res;

        // // let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
        // return (lexer, context) => {
        //     let value, token = factory(lexer);
        //     lexer.try(() => {
        //         value = resolve(lexer);
        //         return value !== null;
        //     });
        //     if (value === null) {
        //         console.log();
        //         return null;
        //     }
        //     token.finalize(value);
        //     if (token.preValidate !== undefined && !token.preValidate()) {
        //         return null;
        //     }
        //     return token;
        //     // new ctor(name, lexer, this);
        //     // lexer.try(() => {
        //     //     value = resolve(lexer);
        //     //     return value !== null;
        //     // });
        // };
        // return res;
    }

    wrapResolver(factory, resolver, ctx) {
        return (lexer) => {
            let value, token = factory(lexer);
            lexer.try(() => {
                value = resolver(lexer);
                return value !== null;
            });
            if (value === null) {
                this.onTokenFail(ctx);
                return null;
            }
            token.finalize(value);
            if (token.preValidate !== undefined && !token.preValidate()) {
                this.onTokenFail(ctx);
                return null;
            }
            this.onTokenOkay(ctx, token);
            return token;
        };
    }

    getResolverFromRule(rule, resolvers) {
        {
            let optional = (elem) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolvers.getTokenResolver(elem);
                    let child = resolver(lexer);
                    return child === null ? [] : [child];
                };
            };
            let repeat = (elem, plus) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolvers.getTokenResolver(elem);
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
                let name = opti ? 'OptionalToken' : 'RepeatToken';
                let resolver = opti ? optional(p1) : repeat(p1, plus);
                let factory = this.#factoryGetter(name);
                resolver = this.wrapResolver(name, resolver);
                return resolvers.push(resolver);
            });
        }
        // {
        //     let lookup = (part) => {
        //         let resolver;
        //         return (lexer) => {
        //             resolver ??= resolvers.doResolve(part);
        //             let res = lexer.look(() => resolver(lexer));
        //             return res !== null ? [] : null;
        //         };
        //     };
        //     rule = rule.replace(/\?(\w+)/g, (m, p1) => {
        //         let name = SpecialToken.LookupToken;
        //         let resolver = lookup(p1);
        //         resolver = this.wrapResolver(name, resolver);
        //         return resolvers.push(resolver);
        //     });
        // }
        // if (rule.includes('|')) {
        //     let parts = rule.split(' | ');
        //     let choice = (parts) => {
        //         let resolver;
        //         return (lexer) => {
        //             resolver ??= parts.map((part) => {
        //                 return resolvers.doResolve(part);
        //             });
        //             let child, result = resolver.some((resolver) => {
        //                 child = resolver(lexer);
        //                 return child !== null;
        //             });
        //             if (!result) {
        //                 return null;
        //             }
        //             return [child];
        //         };
        //     };
        //     let name = SpecialToken.ChoiceToken;
        //     let resolver = choice(parts);
        //     resolver = this.wrapResolver(name, resolver);
        //     return resolvers.push(resolver);
        // }
        let parts = rule.split(' ');
        if (parts.length === 1 && rule !== '*') {
            return rule;
        }
        // let sequence = (parts) => {
        //     let resolver;
        //     return (lexer) => {
        //         resolver ??= parts.map((part) => {
        //             return resolvers.doResolveSpecial(part);
        //         });
        //         let assertion = false, children = [];
        //         let greedy = null;
        //         let result = resolver.every((resolver, i) => {
        //             if (resolver === '*') {
        //                 let name = SpecialToken.GreedyToken;
        //                 let token = this.wrapResolver(name, () => '')(lexer);
        //                 children.push(token);
        //                 greedy = token;
        //                 return true;
        //             }
        //             if (resolver === '^') {
        //                 assertion = true;
        //                 return true;
        //             }
        //             let lastRet;
        //             let ret = () => {
        //                 let child = resolver(lexer);
        //                 if (child === null) {
        //                     lastRet = false;
        //                     return lastRet;
        //                 }
        //                 children.push(child);
        //                 lastRet = true;
        //                 return lastRet;
        //             };
        //             if (greedy === null) {
        //                 return ret();
        //             }
        //             while (!ret()) {
        //                 let character = lexer.eatCharacter();
        //                 if (character === null) {
        //                     break;
        //                 }
        //                 greedy.value += character;
        //             }
        //             greedy = null;
        //             return lastRet;
        //         });
        //         if (!result) {
        //             if (assertion) {
        //                 throw lexer.error();
        //             }
        //             return null;
        //         }
        //         return children;
        //     };
        // };
        // let name = SpecialToken.SequenceToken;
        // let resolver = sequence(parts);
        // resolver = this.wrapResolver(name, resolver);
        // return resolvers.push(resolver);
    }

    tokenize(name, lexer) {
        let ast = this.getTokenResolver(name)(lexer);
        if (ast === null) {
            return null;
        }
        // this.#toAst(ast, parent);
        let filter = (ast) => {
            return [
                'OptionalToken',
                'RepeatToken',
                'ChoiceToken',
                'SequenceToken',
                'LookupToken',
            ].includes(ast.name);
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