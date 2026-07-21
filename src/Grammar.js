import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import AssemblerOperand from './tokens/AssemblerOperand.js';
import AssemblerBlock from './tokens/AssemblerBlock.js';
import AssemblerStatement from './tokens/AssemblerStatement.js';
import Sep from './tokens/Sep.js';
import InternalError from './errors/InternalError.js';

export const Walk = {
    Continue: 1,
    Ignore: 0,
    Stop: -1,
};
const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const tokenCtors = {
    AssemblerOperand,
    Sep,
    AssemblerBlock,
    AssemblerStatement,
};
const SpecialToken = {
    KeywordToken: 'KeywordToken',
    StringToken: 'StringToken',
    OptionalToken: 'OptionalToken',
    RepeatToken: 'RepeatToken',
    ChoiceToken: 'ChoiceToken',
    SequenceToken: 'SequenceToken',
    ReferenceToken: 'ReferenceToken',
    ConditionalToken: 'ConditionalToken',
    GreedyToken: 'GreedyToken',
    LookupToken: 'LookupToken',
};
const isPrimary = (token) => token.is('StringToken', 'KeywordToken', 'Sep');
const isEmpty = (token) => token.children.length === 0;
const hasPrimary = (token) => token.children.filter(isPrimary).length !== 0;
const withParent = (arg) => (token) => token.parent.is(arg);
const withParentParent = (arg) => (token) => token.parent.parent.is(arg);

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
        let resolver = this.getResolverFromRule(name, rule);
        this.tokenResolvers[name] = resolver;
    }

    wrapResolver(name, resolver/* = nullResolver*/) {
        let ctor = this.tokenConstructors[name] ?? this.defaultTokenContructor;
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
            return new ctor(name).finalize(obj);
        };
    }

    getResolverFromRule(name, rule, resolvers) {
        let innerCall = resolvers !== undefined;
        let resolve = (part) => resolvers[part] ?? this.getTokenResolver(part);
        let resolveSpecial = (part) => ['^', '*'].includes(part) ? part : resolve(part);
        let ret = (rule) => innerCall ? rule : resolve(rule);
        if (!innerCall) {
            resolvers = [];
            let originalPush = resolvers.push.bind(resolvers);
            resolvers.push = (element) => {
                let key = resolvers.length;
                originalPush(element);
                return key;
            };
            rule = rule.trim();
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
                return resolvers.push(resolver);
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
            let conditional = (part, attr) => {
                let negate = attr.startsWith('!');
                attr = negate ? attr.slice(1) : attr;
                let resolver;
                return (lexer) => {
                    resolver ??= resolve(part);
                    let child = resolver(lexer);
                    if (child === null) {
                        return null;
                    }
                    let value = child[attr];
                    let isOkay = (!negate && value) || (negate && !value);
                    return isOkay ? [child] : null;
                };
            };
            rule = rule.replace(/(\w+)<(.*?)>/g, (m, p1, p2) => {
                let name = SpecialToken.ConditionalToken;
                let resolver = conditional(p1, p2);
                resolver = this.wrapResolver(name, resolver);
                return resolvers.push(resolver);
            });
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
                return resolvers.push(resolver);
            });
        }
        {
            let lookup = (part) => {
                let resolver;
                return (lexer) => {
                    resolver ??= resolve(part);
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
            rule = resolvers.push(resolver);
        } else if (rule.includes(' ')) {
            let parts = rule.split(' ');
            let sequence = (parts) => {
                let resolvers;
                return (lexer) => {
                    resolvers ??= parts.map(resolveSpecial);
                    let assertion = false, children = [];
                    let greedy = null;
                    let result = resolvers.every((resolver, i) => {
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
                            let char = lexer.eatChar();
                            if (char === null) {
                                break;
                            }
                            greedy.appendChar(char);
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
            rule = resolvers.push(resolver);
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
        if (res === undefined) {
            throw new InternalError;
        }
        return res;
    }

    tokenize(name, lexer, toAst = true, parent = null) {
        let token = this.getTokenResolver(name)(lexer);
        if (toAst && token !== null) {
            token = this.toAst(token, parent);
            token = this.shackle(token);
        }
        return token;
    }

    toAst(token, parent = null) {
        Object.assign(token, {parent, walk, filter, remove, unwrap});
        let list = token.children ?? [];
        list.forEach((child) => {
            this.toAst(child, token);
        });
        return token;
        //
        function walk(callback) {
            let res = callback(this);
            if ([Walk.Ignore, Walk.Stop].includes(res)) {
                return res;
            }
            let list = token.children ?? [];
            for (let child of list) {
                let res = child.walk(callback);
                if (res === Walk.Stop) {
                    return res;
                }
            }
            return Walk.Continue;
        }
        //
        function filter(filterFn) {
            let collector = [];
            if (typeof filterFn === 'string') {
                let names = [];
                let predicates = [];
                for (let filter of filterFn.split('|')) {
                    let idx = filter.indexOf('<');
                    names.push(idx !== -1 ? filter.slice(0, idx) : filter);
                    predicates.push(idx !== -1 ? toPredicate(filter.slice(idx + 1, -1)) : (() => true));
                }
                filterFn = (token) => {
                    let idx = names.indexOf(token.name);
                    return idx !== -1 && predicates[idx](token);
                };
            }
            this.walk((token) => {
                let res = filterFn(token) ?? [];
                res = typeof res === 'boolean' ? [, res] : res;
                res = typeof res === 'number' ? [res] : res;
                let [walk = Walk.Continue, filt = false] = res;
                if (filt) {
                    collector.push(token);
                }
                return walk;
            });
            return collector;
        }
        //
        function remove() {
            let parent = token.parent;
            if (parent === null) {
                return;
            }
            let list = parent.children;
            let idx = list.indexOf(this);
            if (idx === -1) {
                return false;
            }
            list.splice(idx, 1);
            if (list.length === 0) {
                parent.remove();
            }
            return true;
        }
        //
        function unwrap() {
            let parent = this.parent;
            let list = parent.children;
            let children = this.children;
            children.forEach((child) => {
                child.parent = parent;
            });
            let idx = list.indexOf(this);
            if (idx === -1) {
                return false;
            }
            list.splice(idx, 1, ...children);
            return true;
        }
    }

    shackle(ast) {
        let tokens = ast.filter('SequenceToken|RepeatToken|ChoiceToken|OptionalToken|LookupToken|ConditionalToken');
        tokens.forEach((token) => {
            token.unwrap();
        });
        return ast;
    }
}

function toPredicate(predicate) {
    let parts = predicate.split(',');
    let predicates = parts.map(toPredicatePart);
    return (token) => predicates.every((predicate) => predicate(token));
}

function toPredicatePart(part) {
    let negate = part.startsWith('!');
    part = negate ? part.slice(1) : part;
    let fn, arg = null;
    let idx = part.indexOf('=');
    if (idx !== -1) {
        arg = part.slice(idx + 1);
        part = part.slice(0, idx + 1);
    }
    switch (part) {
        case 'isEmpty': {
            fn = isEmpty;
            break;
        }
        case 'isPrimary': {
            fn = isPrimary;
            break;
        }
        case 'hasPrimary': {
            fn = hasPrimary;
            break;
        }
        case 'parent=': {
            fn = withParent(arg);
            break;
        }
        case 'parent.parent=': {
            fn = withParentParent(arg);
            break;
        }
        default: throw new InternalError;
    }
    return (token) => {
        let res = fn(token);
        return (!negate && res) || (negate && !res);
    };
}
