import path from 'node:path';

import {EXT} from './constants.js';
import Compiler from './Compiler.js';
import readJson from './utils/readJson.js';
import parseArgv from './utils/parseArgv.js';
import readFile from './utils/readFile.js';
import writeFile from './utils/writeFile.js';
import makeFileExecutable from './utils/makeFileExecutable.js';
import InvalidArgumentError from './errors/InvalidArgumentError.js';
import NoInputFileError from './errors/NoInputFileError.js';
import NoOutputFileError from './errors/NoOutputFileError.js';
import RequiredArgumentError from './errors/RequiredArgumentError.js';
import ReadJsonError from './errors/ReadJsonError.js';
import ReadFileError from './errors/ReadFileError.js';
import WriteFileError from './errors/WriteFileError.js';
import InvalidInputFileError from './errors/InvalidInputFileError.js';
import readStream from './utils/readStream.js';
import utilsExecute from './utils/execute.js';
import tmp from './utils/tmp.js';
import rmFile from './utils/rmFile.js';

const STD = '-';

export function version({thisName, packageJson, consoleLog, positionals}) {
    let [arg] = positionals;
    if (arg !== undefined) {
        throw new InvalidArgumentError(arg);
    }
    let json = readJson(packageJson);
    if (json === undefined) {
        throw new ReadJsonError(packageJson);
    }
    let version = json.version.split('-').slice(0, 2).join('-');
    let date = json.version.split('-').slice(2).join('-');
    consoleLog('%s %s (%s)', thisName, version, date);
}

export function help({thisName, consoleLog, positionals}) {
    let [arg] = positionals;
    if (arg !== undefined) {
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

export async function execute(opts) {
    let tmpOut = tmp(undefined, '.bin');
    await compile({residentalOutput: tmpOut, ...opts});
    let {code, stdout} = await utilsExecute([tmpOut]).promise;
    opts.stdoutStream.write(stdout);
    rmFile(tmpOut);
    return code;
}

export async function compile({
    positionals,
    currentDirectory,
    logger,
    isStdinStreamTerminal,
    stdinStream,
    residentalOutput = null,
}) {
    let resolve = (file, acceptStd) => (
        file === STD && acceptStd
        ? file
        : path.resolve(currentDirectory, file)
    );
    let defInp = isStdinStreamTerminal ? null : STD;
    let outputFile = residentalOutput;
    if (outputFile === null) {
        positionals = parseArgv(positionals, (arg, next) => {
            switch (arg) {
                case '-o':
                case '-output': {
                    if (next === undefined) {
                        throw new RequiredArgumentError(arg);
                    }
                    outputFile = next;
                    return 1;
                }
            }
            throw new InvalidArgumentError(arg);
        });
    }
    let [inputFile = defInp, arg] = positionals;
    if (arg !== undefined) {
        throw new InvalidArgumentError(arg);
    }
    if (inputFile === null) {
        throw new NoInputFileError;
    }
    if (inputFile === STD && inputFile !== defInp) {
        throw new InvalidInputFileError;
    }
    if (outputFile === null) {
        let ext = path.extname(inputFile);
        if (ext !== EXT) {
            throw new NoOutputFileError;
        }
        outputFile = inputFile.slice(0, -ext.length);
        logger.log('output file %q', outputFile);
    }
    let inputFile_ = resolve(inputFile, true);
    if (inputFile_ !== inputFile) {
        logger.log('resolve %q -> %q', inputFile, inputFile_);
        inputFile = inputFile_;
    }
    let outputFile_ = resolve(outputFile, false);
    if (outputFile_ !== outputFile) {
        logger.log('resolve %q -> %q', outputFile, outputFile_);
        outputFile = outputFile_;
    }
    let inputBuffer;
    if (inputFile === STD) {
        inputBuffer = await readStream(stdinStream, true);
    } else {
        inputBuffer = readFile(inputFile);
        if (inputBuffer === null) {
            throw new ReadFileError(inputFile);
        }
    }
    let compiler = new Compiler({
        logger: logger.prefix('%bold', '(Compiler)'),
    });
    let outputBuffer = compiler.compile(inputBuffer);
    if (!writeFile(outputFile, outputBuffer)) {
        throw new WriteFileError(outputFile);
    }
    logger.log('written to %q successfully', outputFile);
    makeFileExecutable(outputFile);
}
