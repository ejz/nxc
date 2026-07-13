import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import Token from './tokens/Token.js';
import AssemblerOperand from './tokens/AssemblerOperand.js';
import End from './tokens/End.js';
import Sep, {InlineSep, SinglelineCommentBody, MultilineCommentBody} from './tokens/Sep.js';
import InternalError from './errors/InternalError.js';

export const Walk = {
    Continue: 1,
    Ignore: 0,
    Stop: -1,
};
const thisDirectory = fileURLToPath(new URL('.', import.meta.url));
const grammarFile = path.join(thisDirectory, '.nx.g');
const nullResolver = () => null;
const tokenCtors = {
    AssemblerOperand,
    End,
    Sep,
    InlineSep,
    SinglelineCommentBody,
    MultilineCommentBody,
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
        if (res === undefined) {
            throw new InternalError;
        }
        return res;
    }

    tokenize(name, lexer, toAst = true) {
        let token = this.getTokenResolver(name)(lexer);
        if (toAst && token !== null) {
            token = this.toAst(token);
            token = this.shackle(token);
        }
        return token;
    }

    toAst(token, parent = null) {
        Object.assign(token, {parent, walk, filter});
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
                let names = filterFn.split('|');
                filterFn = ({name}) => names.includes(name);
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
    }

    shackle(ast) {
        let tokens = ast.filter('SequenceToken|RepeatToken|ChoiceToken');
        tokens.forEach((token) => {
            let parent = token.parent;
            let list = parent.children;
            token.children.forEach((child) => {
                child.parent = parent;
            });
            let idx = list.indexOf(token);
            list.splice(idx, 1, ...token.children);
        });
        return ast;
    }
}
