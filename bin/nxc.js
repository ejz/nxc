import os from 'node:os';
import path from 'node:path';

import runner from '../src/runner.js';

export const ExitCode = {
    Success: 0,
    Fatal: 1,
};

bootstrap();

function bootstrap({
    fatalExitCode = ExitCode.Fatal,
    successExitCode = ExitCode.Success,
    thisFile = __filename,
    thisDirectory = __dirname,
    thisName = path.basename(thisFile, '.js'),
    packageJson = path.join(thisDirectory, 'package.json'),
    thisProcess = process,
    processPid = thisProcess.pid,
    consoleLog = console.log,
    consoleError = console.error,
    doProcessExit = doProcessExitGetter(thisProcess),
    onFatalError = onFatalErrorGetter(consoleError, fatalExitCode),
    currentDirectory = thisProcess.cwd(),
    argv = thisProcess.argv.slice(2),
    env = thisProcess.env,
    homeDirectory = os.homedir(),
    stdinStream = thisProcess.stdin,
    stdoutStream = thisProcess.stdout,
    stderrStream = thisProcess.stderr,
    isStdinStreamTerminal = stdinStream.isTTY,
    isStdoutStreamTerminal = stdoutStream.isTTY,
    isStderrStreamTerminal = stderrStream.isTTY,
    startedAt = +new Date,
    runner: _runner = runner,
} = {}) {
    return new Promise((resolve) => {
        let onException = (error) => {
            let exitCode = onFatalError(error);
            doProcessExit(exitCode);
            resolve(exitCode);
        }, onRejection = onException;
        thisProcess.on('uncaughtException', onException);
        thisProcess.on('unhandledRejection', onRejection);
        let opts = {
            thisFile,
            thisDirectory,
            thisName,
            packageJson,
            processPid,
            consoleLog,
            consoleError,
            currentDirectory,
            argv,
            env,
            homeDirectory,
            stdinStream,
            stdoutStream,
            stderrStream,
            isStdinStreamTerminal,
            isStdoutStreamTerminal,
            isStderrStreamTerminal,
            startedAt,
        };
        opts.self = opts;
        runner(opts).catch(onFatalError).then((exitCode = successExitCode) => {
            doProcessExit(exitCode);
            resolve(exitCode);
        });
    });
}

function doProcessExitGetter(proc) {
    return (exitCode) => {
        proc.exitCode = exitCode;
    };
}

function onFatalErrorGetter(consoleError, exitCode) {
    return (error) => {
        consoleError('(fatal) %s', error.message);
        return exitCode;
    };
}
