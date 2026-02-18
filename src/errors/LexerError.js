import NxcError from './NxcError.js';

const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export default class LexerError extends NxcError {
    constructor(lexer, {
        catchLen = 1,
        expected = null,
        message = '%s',
        args = 'invalid token',
        position = null,
        context = 3,
        nxcError = null,
    } = {}) {
        message = toArray(message).slice();
        args = toArray(args).slice();
        let lexerState = null;
        if (position !== null) {
            lexerState = lexer.getState();
            lexer.rewind(position);
        }
        let {lines, ptr, shift, pos} = lexer.getContext(context);
        let pad = String(lines.length + shift).length;
        if (expected !== null) {
            message[0] += ': expected %q';
            args.push(expected);
        }
        if (nxcError !== null) {
            message[0] += ': %r';
            args.push([nxcError.message, ...nxcError.arguments]);
        }
        let format = ' %color %color %r';
        lines.forEach((line, i) => {
            let lineNum = String(i + 1 + shift).padStart(pad, ' ');
            let color = ['blue'];
            args.push([color, lineNum]);
            args.push(['blue', '|']);
            args.push(['%s', line]);
            message.push(format);
            if (i !== ptr) {
                return;
            }
            let tail = line.slice(pos);
            if (tail === '') {
                message[message.length - 1] += '%color';
                args.push([line === '' ? 'bgRed' : 'inverse', ' ']);
            }
            catchLen = Math.min(catchLen, tail.length);
            color.push('bold');
            message.push(format);
            args.push([[], ' '.repeat(lineNum.length)]);
            args.push(['blue', '|']);
            args.push([
                ' '.repeat(pos) + '%color',
                [['red', 'bold'], '^'.repeat(catchLen)],
            ]);
        });
        if (lexerState !== null) {
            lexerState.revert();
        }
        message = message.join('\n');
        super(message, ...args);
    }
}
