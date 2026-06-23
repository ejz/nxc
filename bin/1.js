 // AssemblerOperation();
 //    this.instruction = this.operation !== null ? null : this.tokenizeAssemblerInstruction();



// eatFullOperation(args) {
// }
// this.label = this.eatLabelDeclaration();
// if (this.label !== null) {
//     if (this.lexer.eatEnd()) {
//         return this.finalize();
//     }
//     let wcc = this.lexer.whitespaceCommentCollection();
//     if (wcc.isEmpty()) {
//         throw new Error;
//     }
// }
// if (this.eatFullOperation(args) || this.eatFullInstruction(args)) {
//     if (!this.lexer.eatEnd()) {
//         throw new Error;
//     }
//     return this.finalize();
// }
// if (this.label !== null) {
//     throw new Error;
// }
// return null;

// eatAssemblerArguments(args) {
//     let collect = [];
//     while (true) {
//         let argument = this.eatAssemblerArgument(args);
//         if (argument === null) {
//             if (collect.length === 0) {
//                 return [];
//             }
//             throw new InvalidTokenError(this.lexer);
//         }
//         collect.push(argument);
//         if (!this.lexer.eatSpecialCharacter(' , ')) {
//             return collect;
//         }
//     }
// }

// eatAssemblerArgument(args = []) {
//     let ref = this.eatRef();
//     if (ref !== null) {
//         let arg = args[ref];
//         if (arg === undefined) {
//             throw new Error;
//         }
//         return arg;
//     }
//     let argument = this.#eatAssemblerArgument();
//     return argument !== null ? withSelf(argument) : null;
// }

// #eatAssemblerArgument() {
//     let address = this.eatAddress();
//     if (address !== null) {
//         return {type: 'address', address};
//     }
//     let integer = this.eatInteger();
//     if (integer !== null) {
//         return {type: 'integer', integer};
//     }
//     let sib = this.eatSib();
//     if (sib !== null) {
//         return {type: 'sib', sib};
//     }
//     let register = this.eatRegister();
//     if (register !== null) {
//         return {type: 'register', register};
//     }
//     let label = this.eatLabel();
//     if (label !== null) {
//         return {type: 'label', label};
//     }
//     return null;
// }



// tokenizeOperation() {
//     return new AssemblerOperation(this.lexer).tokenize();
// }

// tokenizeInstruction() {
//     return new AssemblerInstruction(this.lexer).tokenize();
// }

// eatRegister() {
//     return this.lexer.eatIdentifier();
// }

// eatInteger() {
//     let integer = null;
//     this.lexer.try(() => {
//         let sign = this.lexer.eatRegex(/^[+-]/);
//         let num = this.lexer.eatNum();
//         if (num === null) {
//             return false;
//         }
//         integer = (sign ?? '') + num;
//         return true;
//     });
//     return integer;
// }

// eatAddress() {
//     let address = null;
//     this.lexer.try(() => {
//         let seg = this.eatRegister() ?? this.eatInteger();
//         if (!this.lexer.eat(':')) {
//             return false;
//         }
//         let off = this.eatInteger();
//         if (off === null) {
//             return false;
//         }
//         address = [seg, off];
//         return true;
//     });
//     return address;
// }

// eatRef() {
//     let ref = null;
//     this.lexer.try(() => {
//         if (!this.lexer.eat('$')) {
//             return false;
//         }
//         ref = this.lexer.eatDecNum();
//         return ref !== null;
//     });
//     return ref;
// }

// compileSib(parts) {
//     let sib = {
//         scale: null,
//         base: null,
//         index: null,
//         disp: null,
//         minus: false,
//     };
//     if (parts.length > 3) {
//         throw new Error;
//     }
//     for (let part of parts) {
//         if (
//             part.type === 'integer'
//             && sib.disp === null
//         ) {
//             sib.disp = part.integer;
//             sib.minus = part.minus;
//             continue;
//         }
//         if (part.type !== 'register') {
//             throw new Error;
//         }
//         if (
//             part.scale !== null
//             && sib.scale === null
//             && sib.index === null
//         ) {
//             sib.scale = part.scale;
//             sib.index = part.register;
//             continue;
//         }
//         if (sib.base === null) {
//             sib.base = part.register;
//             continue;
//         }
//         if (sib.index === null) {
//             sib.index = part.register;
//             continue;
//         }
//         throw new Error;
//     }
//     return withSelf(sib);
// }





// stringifyOperation() {
//     let [argument, ...rest] = this.arguments;
//     let space = rest.length !== 0 ? ' ' : '';
//     let map = (a) => this.stringifyArgument(a);
//     return (
//         map(argument)
//         + ' ' + this.operation + space
//         + rest.map(map).join(', ')
//     );
// }

// stringifyArgument({type: t, register: r, integer: i, address: a, sib: s}) {
//     switch (t) {
//         case 'register':
//             return r;
//         case 'integer':
//             return i;
//         case 'address':
//             return a.join(':');
//         case 'sib': {
//             let {scale, index, base, disp, minus} = s;
//             let sib = '';
//             sib += base ?? '';
//             if (index !== null) {
//                 sib += sib !== '' ? ' + ' : '';
//                 sib += index;
//                 sib += scale !== null ? ' * ' + scale : '';
//             }
//             if (disp !== null) {
//                 sib += sib !== '' ? (minus ? ' - ' : ' + ') : '';
//                 sib += disp;
//             }
//             return '[' + sib + ']';
//         }
//     }
//     throw new Error;
// }





// import InvalidTokenError from '../errors/InvalidTokenError.js';
// import Lexer from '../Lexer.js';
// import operations from '../arch/operations.js';


// const withSelf = (obj) => (obj.self = obj, obj);




// let mnemo = this.eatMnemo();
        // this.arguments = [];
        // while (!this.lexer.eatEnd()) {
        //     if (this.arguments.length === 0) {
        //         let semanticCollection = this.lexer.semanticCollection();
        //         if (!semanticCollection.notEmpty()) {
        //             throw new Error;
        //         }
        //     } else if (!this.lexer.eatSpecial(',')) {
        //         throw new Error;
        //     }
        //     let argument = this.tokenizeAssemblerArgument();
        //     if (argument === null) {
        //         throw new Error;
        //     }
        //     this.arguments.push(argument);
        // }
        // return this.finalize();
        // this.lexer.semanticCollection()
        // ident (can be mnemo)
        // ident register
        // number
        // *u32 [edx], esi
        // BYTE PTR [edx+esi*1+0x29db0ec0]
        // ds:[esi]

        // 0x2149:0xd03b9367

        // base + index * scale
        // *i8
        // 0b1110101
        // u8 i8
        // u16 i16
        // u32 i32
        // u32:u16
        // u64 i64

        // let mnemo = this.eatMnemo();
        // if (mnemo === null) {
        //     return null;
        // }
        // this.mnemo = mnemo.toLowerCase();
        // let asmCommand = asmCommands[this.mnemo];
        // if (asmCommand === undefined) {
        //     throw new Error;
        // }
        // this.arguments = [];
        // while (!this.lexer.eatEnd()) {
        //     if (this.arguments.length === 0) {
                
        //     } else if (!this.lexer.eatSpecial(',')) {
        //         throw new Error;
        //     }
        //     let argument = this.tokenizeAssemblerArgument();
        //     if (argument === null) {
        //         throw new Error;
        //     }
        //     this.arguments.push(argument);
        // }
        // return this.finalize();


        // this.descriptor = descriptor;
        // this.arguments = [];
        // let len = this.descriptor.arguments.length;
        // if (len !== 0 && !this.lexer.semanticCollection().notEmpty()) {
        //     throw new Error;
        // }
        // for (let i = 0; i < len; i++) {
        //     let argument = this.descriptor.arguments[i];
        //     if (!isUserArgument(argument)) {
        //         if (!this.lexer.eat(argument)) {
        //             throw new Error;
        //         }
        //     } else {
        //         let [l] = argument as unknown as [string];
        //         if (l === '$') {
        //             if (!this.lexer.eat('$')) {
        //                 throw new Error;
        //             }
        //             [, l] = argument as unknown as [any, string];
        //         }
        //         let hex = this.eatHex();
        //         if (hex === null) {
        //             throw new Error;
        //         }
        //         let num = normalizeNum(parseInt(hex), l);
        //         if (num === null) {
        //             throw new Error;
        //         }
        //         this.arguments.push(num);
        //     }
        //     if (i !== len - 1 && ) {
        //         throw new Error;
        //     }
        // }
        // if (!this.lexer.eatEnd()) {
        //     throw new Error;
        // }
        // return this.finalize();
    }

    tokenizeAssemblerArgument() {
        let indirect = this.eatIndirect() !== null;
        let register = this.eatRegister();
        if (register !== null) {
            return [register, indirect];
        }
        let effectiveAddress = this.eatEffectiveAddress();
        if (effectiveAddress !== null) {
            effectiveAddress.push(indirect);
            return [effectiveAddress, indirect];
        }
        let scaleIndexBase = this.eatScaleIndexBase();
        if (scaleIndexBase !== null) {
            scaleIndexBase.push(indirect);
            return [scaleIndexBase, indirect];
        }
        return null;
    }

    eatIndirect() {
        return this.lexer.eatRegex(/^\*\s*/);
    }

    eatMnemo() {
        return this.lexer.eatRegex(/^[a-zA-Z][a-zA-Z0-9]+/);
    }

    eatNumeric(withDollar = true) {
        return this.lexer.eatRegex(/^\$?-?(0[xX][0-9a-fA-F]+|\d+)/);
    }

    // eatEffectiveAddress() {
    //     this.lexer.try(() => {
    //         eatNumeric(false)
    //         eatSpecia('(')
    //         eatRegister([gp32])
    //         eatSpecia(')', false)

    //     });
    //     // (%ebp)
    // }

    // eatScaleIndexBase() {
    //     this.lexer.try(() => {
    //         eatNumeric(false)
    //         eatSpecia('(')
    //         eatRegister([gp32])
    //         eatSpecia(',')
    //         eatRegister([gp32])
    //         eatSpecia(',')
    //         eatSpecia(1|2|4|8)
    //         eatSpecia(')', false)

    //     });
    //     0x10(,%edx,)
    //     0x10(,%edx,1)
    // }

    eatRegister(allow = [gp32, gp16, gp8, seg]): string[] {
        let register = this.lexer.eatRegex(/^%[a-z]+[a-z0-9]*/);
        if (register === null) {
            return null;
        }
        if (gp32.includes(register)) {
            if (!allow.includes(gp32)) {
                throw new Error;
            }
            return [register, 'r32'];
        }
        if (gp16.includes(register)) {
            if (!allow.includes(gp16)) {
                throw new Error;
            }
            return [register, 'r16'];
        }
        if (gp8.includes(register)) {
            if (!allow.includes(gp8)) {
                throw new Error;
            }
            return [register, 'r8'];
        }
        if (seg.includes(register)) {
            if (!allow.includes(seg)) {
                throw new Error;
            }
            return [register, 'seg'];
        }
        throw new Error;
    }

    stringify() {
        let ptr = 0;
        let list = this.arguments;
        let line = [
            this.mnemo,
            (list.length !== 0 ? ' ' : ''),
            list.map((a) => a).join(', '),
            ';',
        ].join('');
        return [line];
        //
        // function map(argument: string, ref: AssemblerStatement) {
        //     if (!isUserArgument(argument)) {
        //         return argument;
        //     }
        //     return (
        //         (argument.startsWith('$') ? '$' : '')
        //         + '0x'
        //         + ref.arguments[ptr++].toString(16)
        //     );
        // }
    }

    // toBytes(): number[] {
    //     let bytes = this.descriptor.bytes.slice(0);
    //     let len = this.arguments.length;
    //     this.descriptor.arguments.filter(isUserArgument).reverse().forEach((a, i) => {
    //         a = a.slice(-1);
    //         // [0] === '$' ? a[1] as unknown as string : a;
    //         let num = this.arguments[len - 1 - i];
    //         let w = a === 'b' ? 2 : a === 'w' ? 4 : 8;
    //         let bin = num.toString(16).padStart(w, '0').split(/(..)/).filter(Boolean).reverse();
    //         bytes.push(...bin.map((hex) => parseInt(hex, 16)));
    //     });
    //     return bytes;
    // }
function normalizeNum(num: number, s: string) {
    let min = -0x7f;
    let max = +0xff;
    if (s === 'w') {
        min = -0x7fff;
        max = +0xffff;
    } else if (s === 'l') {
        min = -0x7fffffff;
        max = +0xffffffff;
    }
    let valid = min <= num && num <= max;
    if (!valid) {
        return null;
    }
    return num < 0 ? num + max + 1 : num;
}



import Whitespace from './tokens/Whitespace.js';
import Comment from './tokens/Comment.js';
import Program from './tokens/Program.js';
import ValidateError from './errors/ValidateError.js';

// const gp32 = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'];
// const gp16 = ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'];
// const gp8 = ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'];
// const seg = ['es', 'cs', 'ss', 'ds', 'fs', 'gs'];

// {opcode: number; arguments: string[]; prefix: boolean}

// [EAX]   00  000     00  08  10  18  20  28  30  38
// [ECX]       001     01  09  11  19  21  29  31  39
// [EDX]       010     02  0A  12  1A  22  2A  32  3A
// [EBX]       011     03  0B  13  1B  23  2B  33  3B
// [sib]       100     04  0C  14  1C  24  2C  34  3C
// disp32      101     05  0D  15  1D  25  2D  35  3D
// [ESI]       110     06  0E  16  1E  26  2E  36  3E


// const isUserArgument = (a: string) => ['b', 'w', 'l', '$b', '$w', '$l'].includes(a);

// export type AssemblerStatementDescriptor = {
//     bytes: number[];
//     arguments: string[];
// };

// import readFile from './utils/readFile.js';
// import writeFile from './utils/writeFile.js';
// const commands = {
//     version: versionCommand,
//     help: {
//         fn: helpCommand,
//     },
//     compile: {
//         fn: compileCommand,
//         positionals: [1, 3],
//     },
// };



// if (transport[0] > logLevel)
// warn(format = '', ...args) {
//     return this._log(LogLevel.Warn, format, args);
// }

// error(format = '', ...args) {
//     return this._log(LogLevel.Error, format, args);
// }
// moreVerbose() {
//     this.transports.forEach((transport) => {
//         let [logLevel] = transport;
//         logLevel--;
//         logLevel = Math.max(logLevel, LogLevel.Debug);
//         transport[0] = logLevel;
//     });
//     return this;
// }

// lessVerbose() {
//     this.transports.forEach((transport) => {
//         let [logLevel] = transport;
//         logLevel++;
//         logLevel = Math.min(logLevel, LogLevel.Error);
//         transport[0] = logLevel;
//     });
//     return this;
// }
// 
// _log() {
//     let formatterFormat: string[] = [];
//     let formatterArguments: any[] = [];
//     if (withCounter) {
//         formatterFormat.push('%dim ');
//         formatterArguments.push('[' + String(++counter).padStart(9, '0') + ']');
//     }
//     if (withDatetime) {
//         formatterFormat.push('%dim ');
//         formatterArguments.push('[' + now() + ']');
//     }
//     formatterFormat.push('%color');
//     formatterArguments.push([logLevelColor[logLevel], logLevelText[logLevel]]);
//     logPrefix.forEach((logPrefix) => {
//         formatterFormat.push(' %blue');
//         formatterArguments.push(['/%f/', [logPrefix]]);
//     });
//     formatterFormat.push('%_f');
//     formatterArguments.push(logMessage);
//     output(formatter.format(formatterFormat.join(''), formatterArguments));
// }

// import LogLevel from '~/logger/types/LogLevel';
// import LoggerTransport from '~/logger/types/LoggerTransport';
// import LogPrefix from '~/logger/types/LogPrefix';
// import LogMessage from '~/logger/types/LogMessage';
// import LoggerOptions from '~/logger/types/LoggerOptions';
// import bootstrap from './bootstrap.js';
// import ms from '~/lib/ms';
// import {SIG, PID} from '~/bin2/constants';
// import ExitCode from '~/bin2/types/ExitCode';
// import runner, {RunnerOptions} from '~/bin2/runner';
// import Echo from '~/lib/types/Echo';
// import ipcPayload from '~/bin2/ipcPayload';
// import CustomError from '~/lib/errors/CustomError';

// type RequiredKeys = 'configDirectoryName' | 'actionList';
// type Runner = (runnerOptions: RunnerOptions) => Promise<ExitCode>;
// type DoProcessExit = (exitCode: ExitCode) => void;
// type OnFatalError = (error: Error) => void;
// 
    // , onRejection = onException;
    // if (setupProcessUncaughtExceptionHandler) {
    // }
    // if (setupProcessUnhandledRejectionHandler) {
    // }
                // this.move(i - 1);

    // eat(smth: string) {
    //     if (!this.content.startsWith(smth)) {
    //         return false;
    //     }
    //     this.move(smth.length);
    //     return true;
    //     eatRegex(regex) {
    //     let match = this.content.match(regex);
    //     if (match === null) {
    //         return null;
    //     }
    //     let [m] = match;
    //     this.move(m.length);
    //     return m;
    // }

    

// d(args: any[], pointer: number): string {
    //     let arg = args[pointer];
    //     if (arg === undefined) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     return Number(arg).toFixed();
    // },
    // t(args: any[], pointer: number): string {
    //     let arg = args[pointer];
    //     if (arg === undefined) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     let t = ms() - Number(arg);
    //     return t > 0 ? '(+' + t.toFixed() + ')' : '';
    // },
    // e(args: any[], pointer: number): string {
    //     let arg = args[pointer];
    //     if (arg === undefined || !(arg instanceof Error)) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     return CustomError.prototype.toString.call(arg);
    // },
    // j(args: any[], pointer: number): string {
    //     let arg = args[pointer];
    //     if (arg === undefined) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     return toJson(arg);
    // },
    // f(args: any[], pointer: number, formatter: Formatter): string {
    //     let arg = args[pointer];
    //     if (arg === undefined || !isArray(arg)) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     return (formatter as any).format(...arg);
    // },
    // color(args: any[], pointer: number, formatter: Formatter): string {
    //     let arg = args[pointer];
    //     if (arg === undefined || !isArray(arg)) {
    //         throw new InvalidFormatterArgumentError;
    //     }
    //     let [color, farg] = arg;
    //     if (isArray(farg)) {
    //         farg = (formatter.format as any)(...farg);
    //     }
    //     if (!formatter.colorSupport) {
    //         return farg;
    //     }
    //     return toColorWrapper(color)(farg);
    // },
    // ...mapObj(colorList, (_, k) => {
    //     let colorWrapper = toColorWrapper(k);
    //     return (args: any[], pointer: number, formatter: Formatter): string => {
    //         let arg = args[pointer];
    //         if (arg === undefined) {
    //             throw new InvalidFormatterArgumentError;
    //         }
    //         if (isArray(arg)) {
    //             arg = (formatter.format as any)(...arg);
    //         }
    //         if (!formatter.colorSupport) {
    //             return arg;
    //         }
    //         return colorWrapper(arg);
    //     };
    // }),

    whitespaceCommentCollection() {
        let whitespaceCommentCollection = new WhitespaceCommentCollection();
        while (true) {
            let token = (
                new Comment(this).tokenize()
                ?? new Whitespace(this).tokenize()
            );
            if (token === null) {
                break;
            }
            whitespaceCommentCollection.push(token);
        }
        return whitespaceCommentCollection;
    }

    eatSpecial(special: string, semanticCollectionAfter = true) {
        return this.try(() => {
            this.semanticCollection();
            let res = this.eat(special);
            if (!res) {
                return false;
            }
            if (semanticCollectionAfter) {
                this.semanticCollection();
            }
            return true;
        });
    }

    eatEnd() {
        return this.try(() => {
            let semanticCollection = this.semanticCollection();
            return (
                this.isEndOfFile()
                || this.eat(';')
                || semanticCollection.gotNewline()
                || this.look(() => this.eat('}'))
            );
        });
    }

    

    // replaceCrLf() {
    //     let [head, ...tails] = this.content.split('\r');
    //     this.content = head + tails.map((tail) => {
    //         if (!tail.startsWith('\n')) {
    //             tail = '\n' + tail;
    //         }
    //         return tail;
    //     }).join('');
    // }



// if (command === 'version') {

// }
// console.log(positionals);
// let logger = new Logger((message) => {
//     consoleError('%s', message);
// }, logLevel);

// let finalize = (error: Error): ExitCode => {
//     logger.error('%e', error);
//     let exitCode = ExitCode.FatalError;
//     if (error instanceof ExitCodeError) {
//         exitCode = error.exitCode;
//     } else if (error instanceof CustomError) {
//         exitCode = ExitCode.UnknownCustomError;
//     }
//     return exitCode;
// };
// let colorSupport = runnerOptions.isStderrStreamTerminal;
// let onFinish: OnFinish[] = [];
// let execute = async (actionFunction: ActionFunction, actionOptions: ActionOptions): Promise<ExitCode> => {
//     let exitCode: ExitCode;
//     try {
//         await asyncExecute(actionFunction, actionOptions);
//         exitCode = ExitCode.Ok;
//     } catch (e) {
//         exitCode = finalize(e);
//     }
//     for (let of of onFinish.splice(0)) {
//         await of(exitCode);
//     }
//     return exitCode;
// };

// -colorless
// -colorful
// -C colorless
// -d debug -debug
// -q mute logger
// -t target -target
// version
// compile
// run
// echo 'hi' | rustc - работает
/*
error: expected one of `!` or `::`, found `<eof>`
 --> <anon>:1:1
  |
1 | hi
  | ^^ expected one of `!` or `::`
*/
constructor(buffer) {
        this.lexer = new Lexer(buffer);
        this.validate(buffer);
        let content = buffer.toString();
        this.backup = content;
        this.content = content;
        this.position = 0;
    }

    getState() {
        return {
            lexer: this,
            content: this.content,
            position: this.position,
            revert() {
                this.lexer.content = this.content;
                this.lexer.position = this.position;
            },
        };
    }

    isEndOfFile() {
        return this.content.length === 0;
    }

    move() {
        this.content = this.content.slice(n);
        this.position += n;
    }

    try(someFn) {
        let state = this.getState();
        if (someFn()) {
            return true;
        }
        state.revert();
        return false;
    }

    look(someFn) {
        let state = this.getState();
        let res = someFn();
        state.revert();
        return res;
    }

    validate(buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];
            if (byte > 127) {
                let message = [
                    'only ascii characters are allowed:',
                    'byte',
                    '0x' + byte.toString(16),
                    'at position is invalid character',
                    i,
                ].join(' ');
                throw new Error(message);
            }
        }
    }