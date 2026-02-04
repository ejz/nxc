import path from 'node:path';

import {EXT} from './constants.js';
import Compiler from './Compiler.js';
import readJson from './utils/readJson.js';
import parseArgv from './utils/parseArgv.js';
import readFile from './utils/readFile.js';
import writeFile from './utils/writeFile.js';
import InvalidArgumentError from './errors/InvalidArgumentError.js';
import NoInputFileError from './errors/NoInputFileError.js';
import NoOutputFileError from './errors/NoOutputFileError.js';
import RequiredArgumentError from './errors/RequiredArgumentError.js';
import ReadJsonError from './errors/ReadJsonError.js';
import ReadFileError from './errors/ReadFileError.js';
import WriteFileError from './errors/WriteFileError.js';

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
        tab + 'compile [-o|-output <output>] <input>',
    ].join('\n');
    consoleLog('%s', message);
}

export function compile({positionals, currentDirectory, logger}) {
    let outputFile = null;
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
            default:
                throw new InvalidArgumentError(arg);
        }
    });
    let [inputFile, arg] = positionals;
    if (inputFile === undefined) {
        throw new NoInputFileError;
    }
    if (arg !== undefined) {
        throw new InvalidArgumentError(arg);
    }
    if (outputFile === null) {
        let ext = path.extname(inputFile);
        if (ext !== EXT) {
            throw new NoOutputFileError;
        }
        outputFile = inputFile.slice(0, -ext.length);
        logger.log('output file %q', outputFile);
    }
    let inputFile_ = path.resolve(currentDirectory, inputFile);
    if (inputFile_ !== inputFile) {
        logger.log('resolve %q -> %q', inputFile, inputFile_);
        inputFile = inputFile_;
    }
    let outputFile_ = path.resolve(currentDirectory, outputFile);
    if (outputFile_ !== outputFile) {
        logger.log('resolve %q -> %q', outputFile, outputFile_);
        outputFile = outputFile_;
    }
    let buffer = readFile(inputFile);
    if (buffer === null) {
        throw new ReadFileError(inputFile);
    }
    let compiler = new Compiler({
        logger: logger.prefix('%bold', '(Compiler)'),
    });
    buffer = compiler.compile(buffer);
    if (!writeFile(outputFile, buffer)) {
        throw new WriteFileError(outputFile);
    }
    logger.log('done successfully');
}
