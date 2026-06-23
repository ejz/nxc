import InvalidArgumentError from '../errors/InvalidArgumentError.js';
import RequiredArgumentError from '../errors/RequiredArgumentError.js';

export default function parseArgv(argv, dict) {
    let ready = {};
    dict = splitDict(dict);
    let i = 0;
    for (; i < argv.length; i++) {
        let arg = argv[i];
        if (arg === '--') {
            i++;
            break;
        }
        let isArg = arg.startsWith('-') && arg !== '-';
        if (!isArg) {
            break;
        }
        let desc = dict[arg.slice(1)];
        if (desc === undefined) {
            throw new InvalidArgumentError(arg);
        }
        let [key, cbVal] = desc;
        let isMultiple = cbVal === Infinity;
        cbVal = isMultiple ? true : cbVal;
        if (typeof cbVal === 'boolean') {
            let val = cbVal;
            cbVal = (takeNext) => val ? takeNext() : true;
        }
        let takeNext = () => {
            let next = argv[i + 1];
            if (next === undefined) {
                throw new RequiredArgumentError(arg);
            }
            i++;
            return next;
        };
        let val = cbVal(takeNext);
        if (isMultiple) {
            let ref = ready[key] ??= [];
            ref.push(val);
        } else {
            ready[key] = val;
        }
    }
    return [argv.slice(i), ready];
}

export function splitDict(dict) {
    let split = {};
    for (let k in dict) {
        let v = dict[k];
        let ps = k.split('|');
        let c = ps[ps.length - 1];
        ps.forEach((k) => {
            split[k] = [c, v];
        });
    }
    return split;
}
