import Token from './Token.js';
import InternalError from '../errors/InternalError.js';
// import AssemblerArgument from './AssemblerArgument.js';
// 
const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class AssemblerStatement extends Token {
    toBuffer(arch) {
        let child = this.getChild();
        if (!child.is('AssemblerInstruction')) {
            throw new InternalError;
        }
        let [instructionName] = child.filter('AssemblerInstructionName');
        instructionName = instructionName.stringify();
        let [operandSize = null] = child.filter('AssemblerInstructionOperandSize');
        operandSize = operandSize === null ? null : operandSize.stringify();
        let assemblerArguments = child.filter('AssemblerArgument');
        if (operandSize === null) {
            let scheme = this.getScheme(arch, instructionName, assemblerArguments);
            if (scheme !== undefined) {
                // if (scheme.alias !== undefined) {
                //     return this.toBufferChild(arch, scheme.alias, assemblerArguments);
                // }
                return arch.toBuffer(scheme, assemblerArguments);
            }
        }
        // let operandSizes = arch.opsizes;
        // operandSizes = toArray(operandSize ?? operandSizes);
        // let possible = operandSizes.map((operandSize) => [instructionName, operandSize].join('.'));
        // let schemes = possible.map((instruction) => {
        //     return this.getScheme(arch, instruction, assemblerArguments);
        // });
        // schemes = schemes.filter((scheme) => scheme !== undefined);
        // if (schemes.length !== 1) {
        //     throw 1; // i.error();
        // }
        // let [scheme] = schemes;
        // return arch.toBuffer(scheme, assemblerArguments);
    }

    getScheme(arch, searchKey, asmArgs) {
        let schemes = arch.isa[searchKey];
        return toArray(schemes ?? []).find((scheme) => {
            let schemeArgs = scheme.args;
            let len = asmArgs.length;
            if (!isArray(schemeArgs)) {
                return schemeArgs === len;
            }
            if (schemeArgs.length !== len) {
                return false;
            }
            return schemeArgs.every((schemeArg, i) => {
                let resolver = arch.resolver[schemeArg];
                if (resolver === undefined) {
                    return false;
                }
                [resolver] = resolver;
                return resolver(asmArgs[i]);
            });
        });
    }

    // toBufferChild(arch, ins, myArguments) {
    //     ins = typeof ins === 'function' ? ins(myArguments) : ins;
    //     return [].concat(...toArray(ins).map((ins) => {
    //         let lexer = new Lexer(ins);
    //         let statement = new AssemblerStatement(lexer).tokenize(myArguments);
    //         if (statement === null) {
    //             throw new InternalError;
    //         }
    //         if (!lexer.isEndOfFile()) {
    //             throw new InternalError;
    //         }
    //         return statement.toBuffer(arch);
    //     }));
    // }

    // let {instruction, opsize} = i;
        // let {
        //     operation: o = null,
        //     instruction: i = null,
        // } = this;
        // if (o !== null) {
        //     let scheme = this.getScheme(arch, o.operation, o.arguments);
        //     if (scheme === undefined) {
        //         throw o.error();
        //     }
        //     return this.toBufferChild(arch, scheme.alias, o.arguments);
        // }
        // if (i === null) {
        //     return [];
        // }
    // tokenize(inputArgs) {
    //     let isOkay = this.lexer.try(() => {
    //         this.instruction = this.eatInstruction();
    //         if (this.instruction === null) {
    //             return false;
    //         }
    //         this.opsize = this.eatOperandSize();
    //         let position = this.position;
    //         let wcc = this.lexer.wcc();
    //         this.arguments = this.tokenizeArguments(inputArgs);
    //         if (this.arguments.length !== 0 && wcc.isEmpty()) {
    //             throw this.lexer.error(position);
    //         }
    //         return true;
    //     });
    //     return isOkay ? this.finalize() : null;
    // }

    // tokenizeArguments(inputArgs) {
    //     return AssemblerArgument.tokenizeArguments(this.lexer, inputArgs);
    // }

    // eatInstruction() {
    //     return this.lexer.eatIdentifier({upperCase: true, multiple: '.'});
    // }

    // eatOperandSize() {
    //     let opsize = null;
    //     this.lexer.try(() => {
    //         if (!this.lexer.eat('.')) {
    //             return false;
    //         }
    //         opsize = this.lexer.eatDecNum();
    //         return opsize !== null;
    //     });
    //     return opsize;
    // }

    // stringify() {
    //     let {instruction, opsize} = this;
    //     let space = this.arguments.length !== 0 ? ' ' : '';
    //     return (
    //         instruction
    //         + (opsize !== null ? '.' + opsize : '')
    //         + space
    //         + AssemblerArgument.stringifyArguments(this.arguments)
    //     );
    // }
}


// import Token from './Token.js';
// import Lexer from '../Lexer.js';
// import AssemblerLabel from './AssemblerLabel.js';
// import AssemblerOperation from './AssemblerOperation.js';
// import AssemblerInstruction from './AssemblerInstruction.js';
// import InternalError from '../errors/InternalError.js';

// const isArray = Array.isArray;
// const toArray = (a) => isArray(a) ? a : [a];

// export default class AssemblerStatement extends Token {
//     tokenize(inputArgs) {
//         this.label = this.tokenizeLabel();
//         if (this.label !== null) {
//             if (this.lexer.eatEnd()) {
//                 return this.finalize();
//             }
//             if (this.lexer.wcc().isEmpty()) {
//                 throw this.lexer.error();
//             }
//         }
//         this.operation = this.tokenizeOperation(inputArgs);
//         this.instruction = this.operation !== null ? null : this.tokenizeInstruction(inputArgs);
//         let isOkay = this.operation !== null || this.instruction !== null;
//         if (isOkay) {
//             if (!this.lexer.eatEnd()) {
//                 throw this.lexer.error();
//             }
//             return this.finalize();
//         }
//         if (this.label !== null) {
//             throw this.lexer.error();
//         }
//         return null;
//     }

//     tokenizeLabel() {
//         return new AssemblerLabel(this.lexer).tokenize();
//     }

//     tokenizeOperation(inputArgs) {
//         return new AssemblerOperation(this.lexer).tokenize(inputArgs);
//     }

//     tokenizeInstruction(inputArgs) {
//         return new AssemblerInstruction(this.lexer).tokenize(inputArgs);
//     }

//     stringify() {
//         let {
//             label: l = null,
//             operation: o = null,
//             instruction: i = null,
//         } = this;
//         let line = (
//             (o !== null ? o.stringify() : '')
//             + (i !== null ? i.stringify() : '')
//         );
//         if (l !== null) {
//             let space = line !== '' ? ' ' : '';
//             line = l.stringify() + space + line;
//         }
//         return [line];
//     }
// }
