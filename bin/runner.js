import Logger, {LogLevel} from '../src/utils/Logger.js';
import asyncExecute from '../src/utils/asyncExecute.js';
import parseArgv from '../src/utils/parseArgv.js';
import InvalidCommandError from '../src/errors/InvalidCommandError.js';
import NoCommandError from '../src/errors/NoCommandError.js';

export default async function runner({
    argv,
    consoleError,
    self,
    isStderrStreamTerminal,
    prefixLogger = true,
    onError,
    commands,
}) {
    let echoFn = (msg) => consoleError('%s', msg);
    let logger = new Logger(echoFn);
    logger = prefixLogger ? logger.prefix('%llc', '(%llt)') : logger;
    logger.logLevel = LogLevel.Log;
    logger.enableColor = isStderrStreamTerminal;
    onError((e) => logger.error('%e', e));
    let [positionals] = parseArgv(argv, {
        'd|debug': () => {
            logger.logLevel = LogLevel.Debug;
        },
        'q|quiet': () => {
            logger.logLevel = LogLevel.Error;
        },
        'enable-color': () => {
            logger.enableColor = true;
        },
        'disable-color': () => {
            logger.enableColor = false;
        },
    });
    let command = positionals.shift();
    if (command === undefined) {
        throw new NoCommandError;
    }
    let commandFn = commands[command];
    if (commandFn === undefined) {
        throw new InvalidCommandError(command);
    }
    logger.debug('command %q ready to run ..', command);
    let options = {...self, logger, positionals};
    options.self = options;
    return asyncExecute(commandFn, options);
}

