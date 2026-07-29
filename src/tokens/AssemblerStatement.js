import Token from './Token.js';
import InternalError from '../errors/InternalError.js';
import Lexer from '../Lexer.js';
import Grammar from '../Grammar.js';
// import AssemblerArgument from './AssemblerArgument.js';
// 
const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class AssemblerStatement extends Token {
    toBuffer(arch) {
        let child = this.getChild();
        let assemblerArguments = child.filter('AssemblerArgument');
        let toBufferChild = (ins) => {
            return this.toBufferChild(arch, ins, assemblerArguments);
        };
        let getScheme = (ins) => {
            return this.getScheme(arch, ins, assemblerArguments);
        };
        if (child.is('AssemblerOperation')) {
            let [operationName] = child.filter('AssemblerOperationName');
            operationName = operationName.toString();
            let scheme = getScheme(operationName);
            if (scheme === undefined) {
                throw new InternalError;
            }
            return toBufferChild(scheme.alias);
        }
        if (!child.is('AssemblerInstruction')) {
            throw new InternalError;
        }
        let [instructionName] = child.filter('AssemblerInstructionName');
        instructionName = instructionName.toString();
        let [operandSize = null] = child.filter('AssemblerInstructionOperandSize');
        operandSize = operandSize === null ? null : operandSize.toString().slice(1);
        if (operandSize === null) {
            let scheme = getScheme(instructionName);
            if (scheme !== undefined) {
                if (scheme.alias !== undefined) {
                    return toBufferChild(scheme.alias);
                }
                return arch.toBuffer(scheme, assemblerArguments);
            }
        }
        let operandSizes = arch.opsizes;
        operandSizes = toArray(operandSize ?? operandSizes);
        let possible = operandSizes.map((operandSize) => [instructionName, operandSize].join('.'));
        let schemes = possible.map((instruction) => {
            return getScheme(instruction);
        });
        console.log({schemes});
        schemes = schemes.filter((scheme) => scheme !== undefined);
        if (schemes.length !== 1) {
            throw new Error;
        }
        let [scheme] = schemes;
        return arch.toBuffer(scheme, assemblerArguments);
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

    toBufferChild(arch, ins, myArguments) {
        ins = typeof ins === 'function' ? ins(myArguments) : ins;
        return [].concat(...toArray(ins).map((ins) => {
            let asmStatement = this.tokenize(ins);
            asmStatement.filter('AssemblerReference').forEach((ref) => {
                let i = ref.toString().slice(1);
                let arg = myArguments[i];
                if (arg === undefined) {
                    throw new InternalError;
                }
                arg = arg.clone();
                ref.parent.replace(arg);
            });
            return asmStatement.toBuffer(arch);
        }));
    }
}
