import os from 'node:os';
import path from 'node:path';

const ExitCode = {
    Success: 0,
    Fatal: 1,
    Error: 100,
};

export default function bootstrap({
    thisFile,
    thisDirectory = path.dirname(thisFile),
    runner,
    fatalExitCode = ExitCode.Fatal,
    errorExitCode = ExitCode.Error,
    successExitCode = ExitCode.Success,
    thisName = path.basename(thisFile, '.js'),
    packageJson = path.join(thisDirectory, 'package.json'),
    thisProcess = process,
    processPid = thisProcess.pid,
    pidFile = path.join(os.tmpdir(), '.' + thisName + '.pid'),
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
}) {
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
            thisProcess,
            processPid,
            pidFile,
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
        };
        opts.self = opts;
        let onErrorHandlers = [];
        opts.onError = (on) => onErrorHandlers.push(on);
        let onError = (e) => {
            onErrorHandlers.forEach((on) => on(e));
            return errorExitCode;
        };
        runner(opts).catch(onError).then((exitCode = successExitCode) => {
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
        if (error.message !== '') {
            consoleError('(fatal) %s', error.message);
        } else {
            consoleError('(fatal)');
        }
        return exitCode;
    };
}
