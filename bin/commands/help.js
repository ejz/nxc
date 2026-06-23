import InvalidArgumentError from '../../src/errors/InvalidArgumentError.js';

export default function help({thisName, consoleLog, positionals}) {
    let [arg = null] = positionals;
    if (arg !== null) {
        throw new InvalidArgumentError(arg);
    }
    let start = 'usage: ' + thisName + ' ';
    let pad = ' '.repeat(start.length);
    let tab = ' '.repeat(4);
    let message = [
        start + '[-d|-debug]',
        pad + '[-q|-quiet]',
        pad + '[-enable-color] [-disable-color]',
        pad + '<command> [<args>]',
        'available commands:',
        tab + 'version',
        tab + 'help',
        tab + 'compile [-o|-output <output>] [<input>]',
        tab + 'execute [<input>]',
    ].join('\n');
    consoleLog('%s', message);
}
