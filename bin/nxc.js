import os from 'node:os';
import path from 'node:path';

import nxcRunner from '../src/nxcRunner.js';

const FatalExitCode = 1;

bootstrap();

function bootstrap({
    fatalExitCode = FatalExitCode,
    thisFile = __filename,
    thisDirectory = __dirname,
    thisName = path.basename(thisFile, '.js'),
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
    runner = nxcRunner,
} = {}) {
    let resolve, defer = new Promise((res) => resolve = res);
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
    runner(opts).catch(onFatalError).then((exitCode) => {
        doProcessExit(exitCode);
        resolve(exitCode);
    });
    return defer;
}

function doProcessExitGetter(proc) {
    return (exitCode) => {
        proc.exitCode = exitCode;
    };
}

function onFatalErrorGetter(consoleError, exitCode) {
    return (error) => {
        let message = [error.constructor.name, error.message].filter(Boolean).join(': ');
        consoleError('%s', message);
        return exitCode;
    };
}
