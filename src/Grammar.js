import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import {KeywordToken, StringToken, RegexToken, GreedyToken} from './tokens/ValueToken.js';
import GrammarToken, {SequenceToken, ChoiceToken, GroupToken, OptionalToken, RepeatToken, LookupToken} from './tokens/GrammarToken.js';

import InternalError from './errors/InternalError.js';
import InlineSep from './tokens/InlineSep.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import AssemblerStatement from './tokens/AssemblerStatement.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    InlineSep,
    AssemblerBlock,
    AssemblerStatement,
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
        this.tokenMetas = {};
        this.prepareTokenMetas();
    }

    prepareTokenMetas() {
        let content = this.grammarFileContent
            .split(/\n/g)
            .map((s) => s.trim())
            .filter((s) => s !== '' && !s.startsWith('#'))
            .join('\n');
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, rule] = pairs.slice(i);
            rule = rule.trim().replace(/\s+/g, ' ');
            let ref = this.tokenMetas[name] = {originalRule: rule};
            let ctor = this.tokenConstructors[name] ?? null;
            ref.ctor = ctor ?? this.defaultTokenContructor;
            [ref.rule, ref.innerList] = this.prepareRule(ref.originalRule);
        }
    }

    getTokenResolver(rule, innerList, ...globalParents) {
        let getTokenResolver = (name, ...localParents) => {
            if (isFinite(name)) {
                return innerList[name](...globalParents, ...localParents);
            }
            let {rule: newRule, innerList: newInnerList, ctor} = this.tokenMetas[name];
            return (lexer) => {
                let token = new ctor(name, lexer, this);
                let resolver = this.getTokenResolver(newRule, newInnerList, ...globalParents, ...localParents, token);
                let child = resolver(lexer);
                return token.finalize(child, [].concat(globalParents, localParents));
            };
        };
        if (rule.includes('|')) {
            return (lexer) => {
                let token = new ChoiceToken(lexer, this);
                let child = null;
                rule.split(' | ').some((rule) => {
                    let resolver = getTokenResolver(rule, token);
                    child = resolver(lexer);
                    return child !== null;
                });
                return token.finalize(child, globalParents);
            };
        }
        let parts = rule.split(' ');
        if (parts.length === 1) {
            return getTokenResolver(rule);
        }
        return (lexer) => {
            let token = new SequenceToken(lexer, this);
            let children = [];
            let assertion = false;
            let isResolved = parts.every((rule, i) => {
                if (rule === '^') {
                    assertion = true;
                    return true;
                }
                if (rule === '*') {
                    let rule = parts[i + 1];
                    if (rule === undefined) {
                        throw new InternalError;
                    }
                    let nextResolver = getTokenResolver(rule, token);
                    let greedy = new GreedyToken('*', lexer, this);
                    let got, value = '';
                    while (true) {
                        got = nextResolver(lexer);
                        if (got !== null) {
                            got.reset();
                            break;
                        }
                        let char = greedy.eat();
                        if (char === null) {
                            break;
                        }
                        value += char;
                    }
                    value = got !== null ? value : null;
                    children.push(greedy);
                    return greedy.finalize(value, globalParents) !== null;
                }
                let resolver = getTokenResolver(rule, token);
                let child = resolver(lexer);
                children.push(child);
                return child !== null;
            });
            if (!isResolved && assertion) {
                throw lexer.error();
            }
            children = isResolved ? children : null;
            return token.finalize(children, globalParents);
        };
    }

    prepareRule(rule, innerList = null) {
        let changed = innerList === null;
        innerList ??= [];
        while (changed) {
            changed = false;
            rule = rule.replace(/\( ?([^()]+?) ?\)/g, (m, rule) => {
                changed = true;
                [rule] = this.prepareRule(rule, innerList);
                let elem = (...parents) => (lexer) => {
                    let token = new GroupToken(lexer, this);
                    let resolver = this.getTokenResolver(rule, innerList, ...parents, token);
                    let child = resolver(lexer);
                    return token.finalize(child, parents);
                };
                return innerList.push(elem) - 1;
            });
        }
        rule = rule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (name) => {
            let [char] = name;
            let idx = "`'/".indexOf(char);
            let ctor = [KeywordToken, StringToken, RegexToken][idx];
            let elem = (...parents) => (lexer) => {
                let token = new ctor(name, lexer, this);
                let value = token.eat();
                return token.finalize(value, parents);
            };
            return innerList.push(elem) - 1;
        });
        rule = rule.replace(/\?(\w+)/g, (m, rule) => {
            let elem = (...parents) => (lexer) => {
                let token = new LookupToken(lexer, this);
                let resolver = this.getTokenResolver(rule, innerList, ...parents, token);
                let child = resolver(lexer);
                if (child !== null) {
                    child.reset();
                }
                return token.finalize(child !== null ? [] : null, parents);
            };
            return innerList.push(elem) - 1;
        });
        rule = rule.replace(/(\w+)([*+?])/g, (m, rule, p2) => {
            if (p2 === '?') {
                let elem = (...parents) => (lexer) => {
                    let token = new OptionalToken(lexer, this);
                    let resolver = this.getTokenResolver(rule, innerList, ...parents, token);
                    let child = resolver(lexer);
                    return token.finalize(child ?? [], parents);
                };
                return innerList.push(elem) - 1;
            }
            let min1 = p2 === '+';
            let elem = (...parents) => (lexer) => {
                let token = new RepeatToken(lexer, this);
                let resolver = this.getTokenResolver(rule, innerList, ...parents, token);
                let child, children = [];
                while (child !== null) {
                    child = resolver(lexer);
                    children.push(child);
                }
                children.pop();
                children = min1 && children.length === 0 ? null : children;
                return token.finalize(children, parents);
            };
            return innerList.push(elem) - 1;
        });
        return [rule, innerList];
    }
        // let parents = [].concat(globalParents, localParents);
        // return this.getTokenResolverBackend(rule, innerRef, parents);
        // originalRule.replace(, (m) => {
//     let [char] = m;
//     if (char === '`') {
//         let keyword = m.slice(1, -1);
//         ruleDictionary
//         // let resolver = (lexer) => lexer.eat(keyword);
//         // return ret(name, resolver);
//         return 'KeywordToken';
//     }
//     switch (char) {
//         case '`': {
//         }
        // innerDictionary
        


        // let [char] = name;
        // if (char === '`') {
        //     return (lexer) => {

        //     };
        // }
        // let choice = (parts) => {
        //     let resolver;
        //     return (lexer) => {
        //         resolver ??= parts.map((part) => {
        //             return resolvers.doResolve(part);
        //         });
        //         let child, result = resolver.some((resolver) => {
        //             child = resolver(lexer);
        //             return child !== null;
        //         });
        //         if (!result) {
        //             return null;
        //         }
        //         return [child];
        //     };
        // };
        // let name = SpecialToken.ChoiceToken;
        // let resolver = choice(parts);
        // resolver = this.wrapResolver(name, resolver);
        // return resolvers.push(resolver);
        
            // let {rule, ctor, ctorArgs} = this.tokenMetas[name];
            // return (lexer) => {
            //     // let token = new ctor(lexer, ...ctorArgs);
            //     let resolver = getTokenResolver(rule);
            //     let childToken = resolver(lexer);
            //     return token.finalize(childToken, parents);
            // };
            //     // let sequence = (parts) => {
            //     //     let resolver;
            //     //     return (lexer) => {
            //     //         resolver ??= parts.map((part) => {
            //     //             return resolvers.doResolveSpecial(part);
            //     //         });
            //     //         let assertion = false, children = [];
            //     //         let greedy = null;
            //     //         let result = resolver.every((resolver, i) => {
            //     //             if (resolver === '*') {
            //     //                 let name = SpecialToken.GreedyToken;
            //     //                 let token = this.wrapResolver(name, () => '')(lexer);
            //     //                 children.push(token);
            //     //                 greedy = token;
            //     //                 return true;
            //     //             }
            
            //     //             let lastRet;
            //     //             let ret = () => {
            //     //                 let child = resolver(lexer);
            //     //                 if (child === null) {
            //     //                     lastRet = false;
            //     //                     return lastRet;
            //     //                 }
            //     //                 children.push(child);
            //     //                 lastRet = true;
            //     //                 return lastRet;
            //     //             };
            //     //             if (greedy === null) {
            //     //                 return ret();
            //     //             }
            //     //             while (!ret()) {
            //     //                 let character = lexer.eatCharacter();
            //     //                 if (character === null) {
            //     //                     break;
            //     //                 }
            //     //                 greedy.value += character;
            //     //             }
            //     //             greedy = null;
            //     //             return lastRet;
            //     //         });
            //     //         if (!result) {
            
            //     //             return null;
            //     //         }
            //     //         return children;
            //     //     };
            //     // };
            //  && rule !== '*'
    //         return rule;
    //     }
    // }
        
        // if (ret === )
        // return ret;
        // throw new Error('todo');
        // lexer.eat(keyword)
        // if (ret === null) {
        // } else {
        //     this.onToken(token, parents);
        // }
        //     return null;
        // return token;
        
        // if (char === '`') {
        //     
        //     // let factory = ;
        //     return (lexer) => {
        //         if (lexer.eat(keyword)) {
        //             this.onTokenOkay(token, parents);
        //             return token;
        //         }
        //         this.onTokenFail(token, parents);
        //         return null;
        //         // return new KeywordToken(keyword);
        //         // let value, ;
        //         // lexer.try(() => {
        //         //     value = resolver(lexer, ctx);
        //         //     return value !== null;
        //         // });
        //         // if (value === null) {
        //         //     this.onTokenFail(ctx);
        //         //     return null;
        //         // }
        //         // token.finalize(value);
        //         // // if (token.preValidate !== undefined && !token.preValidate()) {
        //         // //     this.onTokenFail(ctx);
        //         // //     return null;
        //         // // }
        //         // // this.onTokenOkay(ctx, token);
        //         // return token;
        //     }
        // }
        // return this.getTokenResolver(rule);
        // let withCtx = withCtxGetter(ctx);
        // rule = this.getResolverFromRule(rule, tokenResolver, ctx);
        // let ref, resolver = (lexer) => {
        //     // this.getTokenResolver(rule, resolvers);
        //     ref ??= tokenResolver.getTokenResolver(rule);
        //     // [rule] ?? this.#getTokenResolver(rule, newCtx(ctx, rule));
        //     let child = ref(lexer);
        //     return child === null ? null : [child];
        // };
        // return resolver;
        // let factory = this.factoryGetter(name, true);
        // resolver = this.wrapResolver(factory, resolver, ctx);
        // return resolver;
        //
        // console.log({name});
        // console.log({rule});
        // Token1 -> Token2 -> `1` [x]
        // Token1 -> Token2 -> `a` [v] "a"
        // Token1 -> Token2 [v] "a"
        // Token1 [v] "ab"
        
        // let resolvers = [];
        // let originalPush = resolvers.push.bind(resolvers);
        // resolvers.push = (elem) => {
        //     let key = resolvers.length;
        //     originalPush(elem);
        //     return key;
        // };
        // // resolvers.getOriginalBackup = (rule) => resolvers[rule]?.originalBackup ?? rule;
        // resolvers.getTokenResolver = (rule) => {
        //     let ref = resolvers[rule];
        //     if (ref === undefined) {
        //         return this.#getTokenResolver(rule, withCtx(rule));
        //     }
        //     if ()
        // };
        // resolvers.getTokenResolverSpecial = (rule) => ['^', '*'].includes(rule) ? rule : resolvers.getTokenResolver(rule);
        // this.getTokenResolver(rule, resolvers);
        // ref ??= 
        // resolvers[part] ?? ;
        
        
        // this.tokenResolvers[name] = [factory, resolver];
        // resolvers.doResolve(rule);
        // this.wrapResolver(name, (lexer) => {
        //     subResolver ??= resolvers.doResolve(rule);
        // });
    // }

    // factoryGetter(name, customCtor = false) {
    //     let ctor = customCtor ? ctors[name] : this.defaultTokenContructor;
    //     return (lexer) => new ctor(name, lexer, this);
    // }

    

    // __getTokenResolver(name) {
    //     let ref = this.tokenResolvers[name];
    //     return ref.resolver ??= this.#getTokenResolver(name, [name]);
    //     // let [factory, resolver] = resolvers[name] ?? this.tokenResolvers[name];
    //     // resolver = this.wrapResolver(factory, resolver);
    //     // return resolver;
    //     // resolvers = [], special = ['^', '*']
    //     // let res = resolvers[part] ?? this.getTokenResolver(part);
    //     // resolvers.doResolve = (part) => ;
    //     // resolvers.doResolveSpecial = (part) => ;
    //     // let res = this.tokenResolvers[name];
    //     // return (lexer) => res(lexer, context);
    //     // if (res === undefined) {
    //     //     throw new InternalError;
    //     // }
    //     // let [factory, caller] = res;

    //     // // let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
    //     // return (lexer, context) => {
    //     //     let value, token = factory(lexer);
    //     //     lexer.try(() => {
    //     //         value = resolve(lexer);
    //     //         return value !== null;
    //     //     });
    //     //     if (value === null) {
    //     //         console.log();
    //     //         return null;
    //     //     }
    //     //     token.finalize(value);
    //     //     if (token.preValidate !== undefined && !token.preValidate()) {
    //     //         return null;
    //     //     }
    //     //     return token;
    //     //     // new ctor(name, lexer, this);
    //     //     // lexer.try(() => {
    //     //     //     value = resolve(lexer);
    //     //     //     return value !== null;
    //     //     // });
    //     // };
    //     // return res;
    // }

    // wrapResolver(factory, resolver) {
    //     return (lexer, ctx) => {
    //         let value, token = factory(lexer);
    //         lexer.try(() => {
    //             value = resolver(lexer, ctx);
    //             return value !== null;
    //         });
    //         if (value === null) {
    //             this.onTokenFail(ctx);
    //             return null;
    //         }
    //         token.finalize(value);
    //         if (token.preValidate !== undefined && !token.preValidate()) {
    //             this.onTokenFail(ctx);
    //             return null;
    //         }
    //         this.onTokenOkay(ctx, token);
    //         return token;
    //     };
    // }

    // getResolverFromRule(rule, tokenResolver, ctx) {
    //     let withCtx = withCtxGetter(ctx);
    //     {
    
    
    //         rule = rule.replace(/(\d+)([*+?])/g, (m, p1, p2) => {
    //             let plus = p2 === '+';
    //             let opti = p2 === '?';
    //             let name = opti ? 'OptionalToken' : 'RepeatToken';
    //             let resolver = opti ? optional(p1) : repeat(p1, plus);
    //             let factory = this.factoryGetter(name);
    //             resolver = this.wrapResolver(factory, resolver, withCtx(name, resolvers.getOriginalBackup(p1) + p2));
    //             return resolvers.push(resolver);
    //         });
    //     }
    //     // {

    //     // }
    //     
    //     let parts = rule.split(' ');
    //     if (parts.length === 1 && rule !== '*') {
    //         return rule;
    //     }

    //     // let name = SpecialToken.SequenceToken;
    //     // let resolver = sequence(parts);
    //     // resolver = this.wrapResolver(name, resolver);
    //     // return resolvers.push(resolver);
    // }

    tokenize(smth, lexer) {
        let [rule, innerList] = this.prepareRule(smth);
        let tokenResolver = this.getTokenResolver(rule, innerList);
        return tokenResolver(lexer);
    }

    treeShake(ast) {
        let filter = (token) => token instanceof GrammarToken;
        ast.filter(filter).forEach((token) => {
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
//     rule,
// }
// let ruleDictionary = {};
// let modifiedRule = originalRule.replace(/`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
//     let [char] = m;
//     if (char === '`') {
//         let keyword = m.slice(1, -1);
//         ruleDictionary
//         // let resolver = (lexer) => lexer.eat(keyword);
//         // return ret(name, resolver);
//         return 'KeywordToken';
//     }
//     switch (char) {
//         case '`': {
//         }
//         case '\'': {
//             let string = eval(m);
//             let resolver = (lexer) => lexer.eat(string);
//             let name = 'StringToken';
//             return ret(name, resolver); 
//         }
//         case '/': {
//             let regex = eval(m);
//             let resolver = (lexer) => lexer.eatRegex(regex);
//             let name = 'RegexToken';
//             return ret(name, resolver); 
//         }
//     let ret = (name, resolver) => {
//         let factory = this.factoryGetter(name);
//         return ref.add(factory, resolver, m);
//     };
//         default: {
//             let name = m;
//             let factory = this.factoryGetter(name, true);
//             return ref.add(factory, (lexer) => {
//             });
//             //     (ctx) => {
//             //     return this.getTokenResolver(name, ctx);
//             //     let getter = (ctx) => {
//             //         ctx = withCtxGetter(ctx)(m);
//             //     };
//             // });
//             // resolver = this.getTokenResolver(m);
//         }
//     }
// ref.readyRule = ref.rule.replace(/\w+|`.*?`|'.*?'|\/.*?\/\w*/g, (m) => {
// // });
// this.tokenResolvers[name] = ref;
// let ref = {
//     rule,
//     self: this,
//     originalRule,
//     resolvers: [],
//     add(factory, resolver) {
//         let key = this.resolvers.length;
//         this.resolvers.push([factory, resolver]);
//         return key;
//     },
//     get(key) {
//         return this.resolvers[key];
//         // return (parentCtx) => {
//         //     let childCtx = getCtx(parentCtx, ctx);
//         //     return this.self.wrapResolver(factory, resolver);
//         // };
//     },
// };