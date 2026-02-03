import fs from 'node:fs';

import Logger, {LogLevel} from './Logger.js';

export default async function nxcRunner({
    argv,
    consoleError,
    self,
    isStderrStreamTerminal,
    commands: _commands = commands,
}) {
    let logLevel = LogLevel.Log;
    let enableColor = isStderrStreamTerminal;
    let i = 0, marker = false;
    for (; i < argv.length; i++) {
        let arg = argv[i];
        if (['-debug', '-d'].includes(arg)) {
            logLevel = LogLevel.Debug;
            continue;
        }
        if (['-quiet', '-q'].includes(arg)) {
            logLevel = LogLevel.Error;
            continue;
        }
        if (arg === '-enable-color') {
            enableColor = true;
            continue;
        }
        if (arg === '-disable-color') {
            enableColor = false;
            continue;
        }
        if (arg === '--') {
            marker = true;
            i++;
        }
        break;
    }
    let logger = new Logger((message) => consoleError('%s', message));
    logger.logLevel = logLevel;
    logger.enableColor = enableColor;
    logger = logger.prefix('%llc', '(%llt)');
    let positionals = argv.slice(i);
    if (positionals.length === 0) {
        logger.error('no command provided, check `help`');
        throw new Error;
    }
    let command = positionals.shift();
    if (command.startsWith('-') && !marker) {
        logger.error('invalid argument `%s`', command);
        throw new Error;
    }
    let commandDescriptor = _commands[command];
    if (commandDescriptor === undefined) {
        logger.error('invalid command `%s`', command);
        throw new Error;
    }
    let {positionals: [min, max], fn} = commandDescriptor;
    let len = positionals.length;
    if (len < min) {
        logger.error('missing required positional arguments');
        throw new Error;
    }
    if (max < len) {
        let [arg] = positionals.slice(max);
        logger.error('invalid argument `%s`', arg);
        throw new Error;
    }
    let commandOptions = {
        ...self,
        logger,
        positionals,
    };
    commandOptions.self = commandOptions;
    return fn(commandOptions);
}

const commands = {
    version: {
        fn: versionCommand,
        positionals: [0, 0],
    },
    help: {
        fn: helpCommand,
        positionals: [0, 0],
    },
};

function versionCommand({thisName, packageJson, consoleLog}) {
    let json = JSON.parse(fs.readFileSync(packageJson));
    let version = json.version.split('-').slice(0, 2).join('-');
    let date = json.version.split('-').slice(2).join('-');
    consoleLog('%s %s (%s)', thisName, version, date);
}

function helpCommand({thisName, consoleLog}) {
    let start = 'usage: ' + thisName + ' ';
    let message = [
        start + '[-d|-debug]',
        ' '.repeat(start.length) + '[-q|-quiet]',
        ' '.repeat(start.length) + '[-enable-color] [-disable-color]',
        ' '.repeat(start.length) + '<command> [<args>]',
    ].join('\n');
    consoleLog('%s', message);
}
