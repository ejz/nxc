import path from 'node:path';

import parseArgv from '../../src/utils/parseArgv.js';
import readFile from '../../src/utils/readFile.js';
import InvalidArgumentError from '../../src/errors/InvalidArgumentError.js';
import NoInputFileError from '../../src/errors/NoInputFileError.js';
import NoOutputFileError from '../../src/errors/NoOutputFileError.js';
import InvalidInputFileError from '../../src/errors/InvalidInputFileError.js';
import ReadFileError from '../../src/errors/ReadFileError.js';
import Compiler from '../../src/Compiler.js';
import readStream from '../../src/utils/readStream.js';
import writeFile from '../../src/utils/writeFile.js';
import makeFileExecutable from '../../src/utils/makeFileExecutable.js';

const EXT = '.nx';
const STD = '-';

export default async function compile({
    positionals,
    currentDirectory,
    logger,
    isStdinStreamTerminal,
    stdinStream,
}) {
    let resolve = (file, acceptStd) => (
        file === STD && acceptStd
        ? file
        : path.resolve(currentDirectory, file)
    );
    let defInp = isStdinStreamTerminal ? null : STD;
    let [[inputFile = defInp, arg = null], {output: outputFile}] = parseArgv(positionals, {'o|output': true});
    if (arg !== null) {
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
    if (
        !writeFile(outputFile, outputBuffer)
        || !makeFileExecutable(outputFile)
    ) {
        throw new WriteFileError(outputFile);
    }
    logger.log('written to %q successfully', outputFile);
}
