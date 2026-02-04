import readJson from './utils/readJson.js';
import ReadJsonError from './errors/ReadJsonError.js';
import InvalidArgumentError from './errors/InvalidArgumentError.js';

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
