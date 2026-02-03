import fs from 'node:fs';

import Logger, {LogLevel} from './Logger.js';
import Compiler from './Compiler.js';

export default async function runner({
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
    compile: {
        fn: compileCommand,
        positionals: [1, 3],
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
        tab + 'compile [-o|-output <output>] <input>',
    ].join('\n');
    consoleLog('%s', message);
}

function compileCommand({positionals, currentDirectory, logger}) {
    let outputFile = 'a.out';
    let i = 0, marker = false;
    for (; i < positionals.length; i++) {
        let pos = positionals[i];
        let next = positionals[i + 1];
        if (['-o', '-output'].includes(arg)) {
            if (next === undefined) {
                logger.error('no argument value for `%s`', arg);
                throw new Error;
            }
            outputFile = next;
            continue;
        }
        if (arg === '--') {
            marker = true;
            i++;
        }
        break;
    }
    positionals = positionals.slice(i);
    if (positionals.length === 0) {
        logger.error('no input file provided');
        throw new Error;
    }
    let inputFile = positionals.shift();
    if (inputFile.startsWith('-') && !marker) {
        logger.error('invalid argument `%s`', inputFile);
        throw new Error;
    }
    let buffer;
    try {
        buffer = fs.readFileSync(inputFile);
    } catch {
        logger.error('could not read `%s`', inputFile);
        throw new Error;
    }
    let compiler = new Compiler({
        logger: logger.prefix('%bold', 'Compiler:'),
    });
    buffer = compiler.compile(buffer);
    try {
        fs.writeFileSync(outputFile, buffer);
    } catch {
        logger.error('could not write to `%s`', outputFile);
        throw new Error;
    }
    logger.log('done successfully');
}
