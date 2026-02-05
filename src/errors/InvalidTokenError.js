import NxcError from './NxcError.js';

export default class InvalidTokenError extends NxcError {
    constructor(lexer, catchLen = 1, expected = null) {
        let parsed = lexer.backup.slice(0, lexer.position);
        let lines = parsed.split('\n');
        let len = lines.length;
        let pad = String(len).length;
        let message = ['%s'];
        let args = ['invalid token:'];
        if (expected !== null) {
            message[0] += ' expected %q';
            args.push(expected);
        }
        lines = lines.slice(-4);
        let repeat = 0;
        lines.forEach((line, i) => {
            let n = len - lines.length + i + 1;
            let isLast = n === len;
            let nn = String(n).padStart(pad, ' ');
            let format = ' %color %color %s';
            message.push(format);
            let color = ['blue'];
            if (isLast) {
                color.push('bold');
            }
            args.push([color, nn]);
            args.push(['blue', '|']);
            args.push(line);
            if (isLast) {
                repeat = format.replace(/%\S+/g, '').length;
                repeat += args.at(-1).length;
                repeat += args.at(-2)[1].length;
                repeat += args.at(-3)[1].length;
            }
        });
        let token = lexer.content.slice(0, catchLen);
        if (token === '') {
            message[message.length - 1] += '%color';
            args.push(['bgRed', ' ']);
            catchLen = 1;
        } else {
            message[message.length - 1] += '%s';
            args.push(token);
        }
        message.push(' '.repeat(repeat) + '%color');
        args.push([['red', 'bold'], '^'.repeat(catchLen)]);
        message = message.join('\n');
        super(message, ...args);
    }
}
