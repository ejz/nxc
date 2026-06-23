import Token from './tokens/Token.js';
import {tokens, constructors} from './grammar.js';

export default class Grammar {
    constructor() {
        this.tokens = {};
        this.constructors = constructors;
        this.populateTokens(tokens);
    }

    populateTokens(tokens) {
        for (let [key, value] of Object.entries(tokens)) {
            this.tokens[key] = this.getTokenResolver(key, value);
        }
    }

    getTokenResolver(key, value) {
        let ctorKey = key.split('.').shift();
        let withToken = (fn) => {
            return (lexer, parent) => {
                let ctor = this.constructors[ctorKey] ?? Token;
                let token = new ctor(key, lexer, parent);
                let position = lexer.position;
                token = fn(token, this);
                if (token === null) {
                    lexer.position = position;
                    return null;
                }
                return token;
            };
        };
        if (value === '!') {
            return () => null;
        }
        if (value instanceof RegExp) {
            let regex = value;
            return withToken((token) => {
                let value = token.lexer.eatRegex(regex);
                if (value === null) {
                    return null;
                }
                return token.finalize({value});
            });
        }
        if (typeof value === 'function') {
            return withToken(value);
        }
        let star = value.endsWith('*');
        let plus = value.endsWith('+');
        let ques = value.endsWith('?');
        let tail = value.slice(0, -1);
        if (star || plus || ques) {
            value = tail;
            return withToken((token) => {
                let children = [];
                while (true) {
                    let child = this.tokens[value](token.lexer, token);
                    if (child === null) {
                        break;
                    }
                    children.push(child);
                    if (ques) {
                        break;
                    }
                }
                if (ques) {
                    let [child = null] = children;
                    return token.finalize({child});
                }
                if (plus && children.length === 0) {
                    return null;
                }
                return token.finalize({children});
            });
        }
        if (!value.includes('|')) {
            return withToken((token) => {
                let children = [];
                let assertion = false;
                let lastValue = null;
                let result = value.split(' ').every((value) => {
                    if (value === '^') {
                        assertion = true;
                        return true;
                    }
                    lastValue = value;
                    let child = this.tokens[value](token.lexer, token);
                    children.push(child);
                    return child !== null;
                });
                if (!result) {
                    if (assertion) {
                        console.log(token.lexer, token.lexer.content.slice(token.lexer.position));
                        if (token.lexer.isEof()) {
                            throw new Error;
                        }
                        throw new Error;
                    }
                    return null;
                }
                return token.finalize({children});
            });
        }
        return withToken((token) => {
            let child = null;
            let result = value.split(' | ').some((value) => {
                console.log({value});
                child = this.tokens[value](token.lexer, token);
                return child !== null;
            });
            if (!result) {
                return null;
            }
            return token.finalize({child});
        });
    }

    tokenize(key, lexer) {
        let token = this.tokens[key](lexer, null);
        return token;
    }
}
