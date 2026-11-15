import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import KeywordToken from './tokens/KeywordToken.js';
// import AssemblerBlock from './tokens/AssemblerBlock.js';
// import AssemblerStatement from './tokens/AssemblerStatement.js';
// import InlineSep from './tokens/InlineSep.js';
// import InternalError from './errors/InternalError.js';

const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    // InlineSep,
    // AssemblerBlock,
    // AssemblerStatement,
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
// const logTokenChain = (isOkay, token, parents) => {
    
// };
const onTokenDefault = (isOkay) => (token, parents) => {
    let map = (t) => t.name;
    let delim = '<-';
    console.log(
        '(%s) %s %s',
        parents.length,
        isOkay ? '[v]' : '[x]',
        token.name + (parents.length === 0 ? '' : delim) + parents.map(map).join(delim),
    );
};
const onTokenFailDefault = (token, parents) => {
    logTokenChain(false, token, parents);
};

export default class Grammar {
    constructor({
        grammarFileContent = fs.readFileSync(grammarFile).toString(),
        defaultTokenContructor = Token,
        tokenConstructors = tokenCtors,
        onTokenOkay = onTokenDefault(true),
        onTokenFail = onTokenDefault(false),
    } = {}) {
        this.grammarFileContent = grammarFileContent;
        this.defaultTokenContructor = defaultTokenContructor;
        this.tokenConstructors = tokenConstructors;
        this.tokenRules = {};
        this.onTokenOkay = onTokenOkay;
        this.onTokenFail = onTokenFail;
        this.prepareTokenRules();
    }

    prepareTokenRules() {
        let content = this.grammarFileContent
            .split(/\n/g)
            .map((s) => s.trim())
            .filter((s) => s !== '' && !s.startsWith('#'))
            .join('\n');
        let pairs = content.split(/(\w+)\s*->\s*/).slice(1);
        for (let i = 0; i < pairs.length; i += 2) {
            let [name, rule] = pairs.slice(i);
            rule = rule.trim().replace(/\s+/g, ' ');
            this.tokenRules[name] = rule;
        }
    }

    getTokenResolver(name, parents = []) {
        let [char] = name;
        if (char === '`') {
            return (lexer) => {
                let token = new KeywordToken(name, lexer);
                let got = token.resolve();
                return this.onToken(got, token, parents);
                // lexer.eat(keyword)
                // if (ret === null) {
                    
                // } else {
                //     this.onToken(token, parents);
                // }
                //     return null;
                // return token;
            };
        }
        throw new Error('todo');
        // let {rule, ctor} = this.tokenRules[name];
        // return (lexer) => {
        //     let token = new ctor
        //     parents = parents.slice();
        //     parents.push(token);
        //     let resolver = this.getTokenResolver(rule, parents);
        //     let ret = resolver(lexer);
        //     // if (ret === )
        //     return ret;
        // };
    }

    onToken(result, token, parents) {
        if (result === null) {
            this.onTokenFail(token, parents);
        } else {
            this.onTokenOkay(token, parents);
        }
        return result;
    }
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
        // let changed = true;
        // while (changed) {
        //     changed = false;
        //     rule = rule.replace(/\( ?([^()]+?) ?\)/g, (m, p) => {
        //         changed = true;
        //         return this.getResolverFromRule(p, tokenResolver, ctx);
        //     });
        // }
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
    //         let optional = (elem) => {
    //             let resolver;
    //             return (lexer) => {
    //                 resolver ??= resolvers.getTokenResolver(elem);
    //                 let child = resolver(lexer);
    //                 return child === null ? [] : [child];
    //             };
    //         };
    //         let repeat = (elem, plus) => {
    //             let resolver;
    //             return (lexer) => {
    //                 resolver ??= resolvers.getTokenResolver(elem);
    //                 let child, children = [];
    //                 while (child !== null) {
    //                     child = resolver(lexer);
    //                     children.push(child);
    //                 }
    //                 children.pop();
    //                 if (plus && children.length === 0) {
    //                     return null;
    //                 }
    //                 return children;
    //             };
    //         };
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
    //     //     let lookup = (part) => {
    //     //         let resolver;
    //     //         return (lexer) => {
    //     //             resolver ??= resolvers.doResolve(part);
    //     //             let res = lexer.look(() => resolver(lexer));
    //     //             return res !== null ? [] : null;
    //     //         };
    //     //     };
    //     //     rule = rule.replace(/\?(\w+)/g, (m, p1) => {
    //     //         let name = SpecialToken.LookupToken;
    //     //         let resolver = lookup(p1);
    //     //         resolver = this.wrapResolver(name, resolver);
    //     //         return resolvers.push(resolver);
    //     //     });
    //     // }
    //     // if (rule.includes('|')) {
    //     //     let parts = rule.split(' | ');
    //     //     let choice = (parts) => {
    //     //         let resolver;
    //     //         return (lexer) => {
    //     //             resolver ??= parts.map((part) => {
    //     //                 return resolvers.doResolve(part);
    //     //             });
    //     //             let child, result = resolver.some((resolver) => {
    //     //                 child = resolver(lexer);
    //     //                 return child !== null;
    //     //             });
    //     //             if (!result) {
    //     //                 return null;
    //     //             }
    //     //             return [child];
    //     //         };
    //     //     };
    //     //     let name = SpecialToken.ChoiceToken;
    //     //     let resolver = choice(parts);
    //     //     resolver = this.wrapResolver(name, resolver);
    //     //     return resolvers.push(resolver);
    //     // }
    //     let parts = rule.split(' ');
    //     if (parts.length === 1 && rule !== '*') {
    //         return rule;
    //     }
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
    //     //             if (resolver === '^') {
    //     //                 assertion = true;
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
    //     //             if (assertion) {
    //     //                 throw lexer.error();
    //     //             }
    //     //             return null;
    //     //         }
    //     //         return children;
    //     //     };
    //     // };
    //     // let name = SpecialToken.SequenceToken;
    //     // let resolver = sequence(parts);
    //     // resolver = this.wrapResolver(name, resolver);
    //     // return resolvers.push(resolver);
    // }

    tokenize(name, lexer) {
        let tokenResolver = this.getTokenResolver(name);
        return tokenResolver(lexer);
        // if (ast === null) {
        //     return null;
        // }
        // // this.#toAst(ast, parent);
        // let filter = (ast) => {
        //     return [
        //         'OptionalToken',
        //         'RepeatToken',
        //         'ChoiceToken',
        //         'SequenceToken',
        //         'LookupToken',
        //     ].includes(ast.name);
        // };
        // let tokens = ast.filter(filter);
        // tokens.forEach((token) => {
        //     token.unwrap();
        // });
        // return ast;
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