import Logger, {LogLevel} from './Logger.js';
import parseArgv from './utils/parseArgv.js';
import * as commands from './commands.js';
import asyncExecute from './utils/asyncExecute.js';
import NxcError from './errors/NxcError.js';
import InvalidArgumentError from './errors/InvalidArgumentError.js';
import InvalidCommandError from './errors/InvalidCommandError.js';
import NoCommandError from './errors/NoCommandError.js';

export default async function runner({
    argv,
    consoleError,
    self,
    isStderrStreamTerminal,
    prefixLogger = true,
    onError,
    commands: _commands = commands,
}) {
    let echoFn = (msg) => consoleError('%s', msg);
    let logger = new Logger(echoFn);
    logger = prefixLogger ? logger.prefix('%llc', '(%llt)') : logger;
    logger.logLevel = LogLevel.Log;
    logger.enableColor = isStderrStreamTerminal;
    onError((e) => {
        if (e instanceof NxcError) {
            logger.error(e.message, ...e.arguments);
            e = new Error;
        }
        return e;
    });
    let positionals = parseArgv(argv, (arg) => {
        switch (arg) {
            case '-d':
            case '-debug':
                logger.logLevel = LogLevel.Debug;
                return;
            case '-q':
            case '-quiet':
                logger.logLevel = LogLevel.Error;
                return;
            case '-enable-color':
                logger.enableColor = true;
                return;
            case '-disable-color':
                logger.enableColor = false;
                return;
            default:
                throw new InvalidArgumentError(arg);
        }
    });
    let command = positionals.shift();
    if (command === undefined) {
        throw new NoCommandError;
    }
    let commandFn = _commands[command];
    if (commandFn === undefined) {
        throw new InvalidCommandError(command);
    }
    logger.debug('command `%s` ready to run ..', command);
    let options = {...self, logger, positionals};
    options.self = options;
    return asyncExecute(commandFn, options);
}
