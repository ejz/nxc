export default function parseArgv(argv, cb) {
    let i = 0;
    for (; i < argv.length; i++) {
        let arg = argv[i];
        let next = argv[i + 1];
        if (arg === '--') {
            i++;
            break;
        }
        if (arg.startsWith('-')) {
            i += cb(arg, next) ?? 0;
            continue;
        }
        break;
    }
    return argv.slice(i);
}
