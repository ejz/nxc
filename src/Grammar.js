import Token from './Token.js';
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
                // if (!/newline|comment|string|space/i.test(key)) console.log(key);
                // if (key === 'AssemblerStatementWhitespaceCommentCollectionCollection')
                // if (parent && parent.name.includes('Collection'))
                    // console.log(parent/*?.children?.length*/);
                let ctor = this.constructors[ctorKey] ?? Token;
                let token = new ctor(key, lexer, parent);
                let position = lexer.position;
                token = fn(token, this);
                // console.log({token});
                if (token === null) {
                    lexer.position = position;
                    return null;
                }
                return token;
            };
        };
        if (typeof value === 'function') {
            return withToken(value);
        }
        let star = value.endsWith('*');
        let plus = value.endsWith('+');
        let tail = value.slice(0, -1);
        if (star || plus) {
            value = tail;
            return withToken((token) => {
                let children = [];
                while (true) {
                    let child = this.tokens[value](token.lexer, token);
                    if (child === null) {
                        break;
                    }
                    children.push(child);
                }
                if (plus && children.length === 0) {
                    return null;
                }
                return token.finalize({children});
            });
        }
        if (value.includes(',')) {
            return withToken((token) => {
                let children = [];
                let result = value.split(',').every((value) => {
                    let child = this.tokens[value](token.lexer, token);
                    children.push(child);
                    return child !== null;
                });
                if (!result) {
                    return null;
                }
                return token.finalize({children});
            });
        }
        return withToken((token) => {
            let child = null;
            let result = value.split('|').some((value) => {
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
