import readJson from '../../src/utils/readJson.js';
import InvalidArgumentError from '../../src/errors/InvalidArgumentError.js';
import ReadJsonError from '../../src/errors/ReadJsonError.js';

export default function version({thisName, packageJson, consoleLog, positionals}) {
    let [arg = null] = positionals;
    if (arg !== null) {
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
