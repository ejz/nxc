export const LogLevel = {
    Debug: 0,
    Log: 1,
    Warn: 2,
    Error: 3,
};

export default class Logger {
    constructor(logTo, logLevel = LogLevel.Debug) {
        this.logTo = logTo;
        this.formatter = formatter;
        this.logLevel = logLevel;
    }

    debug(...args) {
        this._log(LogLevel.Debug, args);
    }

    log(...args) {
        this._log(LogLevel.Log, args);
    }

    warn(...args) {
        this._log(LogLevel.Warn, args);
    }

    error(...args) {
        this._log(LogLevel.Error, args);
    }

    _log(logLevel, args) {
        if (this.logLevel > logLevel) {
            return;
        }
        this.logTo(this._format(logLevel, args));
    }

    _format(logLevel, args) {
        let format = args.shift();
        format = format === undefined ? '' : format;
        let ptr = 0;
        return format.replace(/%(%|_?[a-zA-Z]+_?)/g, (m, p) => {
            if (p === '%') {
                return '%';
            }
            let start_ = p.at(0) === '_';
            p = start_ ? p.slice(1) : p;
            let end_ = p.at(-1) === '_';
            p = end_ ? p.slice(0, -1) : p;
            let formatter = this.formatter[p];
            if (typeof formatter !== 'function') {
                throw new Error('unknown formatter `' + p + '`');
            }
            let line = formatter(args, ptr++);
            if (line === '') {
                return '';
            }
            return (start_ ? ' ' : '') + line + (end_ ? ' ' : '');
        });
    }
}

export const formatter = {
    s(args, ptr) {
        let arg = args[ptr];
        if (arg === undefined) {
            throw new Error('invalid log argument');
        }
        return arg.toString();
    },
};
