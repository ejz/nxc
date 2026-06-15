import Token from './tokens/Token.js';

export default class Grammar {
    constructor(grammar) {
        this.grammar = {};
        this.populateGrammar(grammar);
    }

    populateGrammar(grammar) {
        for (let [key, value] of Object.entries(grammar)) {
            this.grammar[key] = this.getResolver(key, value);
        }
    }

    getResolver(key, value) {
        if (typeof value === 'function') {
            return (lexer) => {
                let position = lexer.position;
                let token = value(new Token(key, lexer));
                if (token === null) {
                    lexer.position = position;
                    return null;
                }
                return token;
            };
        }
        // if (typeof value === 'number') {

        // }
        // if (/^\d+$/.test(value)) {
        //     let char = String.fromCharCode(+value);
        //     return closure((lexer, token) => {
        //         if (!lexer.eat(char)) {
        //             return null;
        //         }
        //         return token.finalize();
        //     });
        // }
                // let token = new Token(key, lexer);
        // let star = value.endsWith('*');
        // let plus = value.endsWith('+');
        // let ques = value.endsWith('?');
        // let tail = value.slice(0, -1);
        // if (ques) {
        //     value = tail;
        //     return (lexer) => {
        //         let token = new Token(key, lexer);
        //         let child = this.resolver[value](lexer);
        //         return token.finalize({child});
        //     };
        // }
        // if (star || plus) {
        //     value = tail;
        //     return (lexer) => {
        //         let token = new Token(key, lexer);
        //         let children = [];
        //         while (true) {
        //             let child = this.resolver[value](lexer);
        //             if (child === null) {
        //                 break;
        //             }
        //             children.push(child);
        //         }
        //         if (plus && children.length === 0) {
        //             return null;
        //         }
        //         return token.finalize({children});
        //     };
        // }
        // if (value.includes(',')) {
        //     return (lexer) => {
        //         let token = new Token(key, lexer);
        //         let children = [];
        //         let result = value.split(',').every((value) => {
        //             let child = this.resolver[value](lexer);
        //             children.push(child);
        //             return child !== null;
        //         });
        //         if (!result) {
        //             return null;
        //         }
        //         return token.finalize({children});
        //     };
        // }
        // return (lexer) => {
        //     let token = new Token(key, lexer);
        //     let child = null;
        //     let result = value.split('|').some((value) => {
        //         child = this.resolver[value](lexer);
        //         return child !== null;
        //     });
        //     if (!result) {
        //         return null;
        //     }
        //     return token.finalize({child});
        // };
    }

    tokenize(key, lexer) {
        return this.grammar[key](lexer);
    }
}
