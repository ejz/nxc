const newObj = (obj, fn) => {
    let r = {};
    for (let k in obj) {
        r[k] = fn(k, obj);
    }
    return r;
}
const isArray = Array.isArray;
const toArray = (a) => isArray(a) ? a : [a];

export const LogLevel = {
    Debug: 0,
    Log: 1,
    Warn: 2,
    Error: 3,
};

export const colorList = {
    bold:      [1,  22],
    dim:       [2,  22],
    italic:    [3,  23],
    underline: [4,  24],
    overline:  [53, 55],
    inverse:   [7,  27],
    hidden:    [8,  28],
    strike:    [9,  29],
    black:     [30, 39],
    red:       [31, 39],
    green:     [32, 39],
    yellow:    [33, 39],
    blue:      [34, 39],
    magenta:   [35, 39],
    cyan:      [36, 39],
    white:     [37, 39],
    bgBlack:   [40, 49],
    bgRed:     [41, 49],
    bgGreen:   [42, 49],
    bgYellow:  [43, 49],
    bgBlue:    [44, 49],
    bgMagenta: [45, 49],
    bgCyan:    [46, 49],
    bgWhite:   [47, 49],
};

const logLevelText = {
    [LogLevel.Debug]: 'debug',
    [LogLevel.Log]: 'log',
    [LogLevel.Warn]: 'warn',
    [LogLevel.Error]: 'error',
};

const logLevelColor = {
    [LogLevel.Debug]: 'dim',
    [LogLevel.Log]: 'white',
    [LogLevel.Warn]: 'yellow',
    [LogLevel.Error]: 'red',
};

export default class Logger {
    constructor(logTo, f = formatter) {
        this.logTo = logTo;
        this.formatter = {...f};
        this.logLevel = LogLevel.Debug;
        this.enableColor = false;
        this._prefix = [];
    }

    prefix(...args) {
        let [format = ''] = args;
        if (format === '') {
            return this;
        }
        let prefix = this._prefix.slice();
        prefix.push(args);
        let logger = new Logger(this.logTo, this.formatter);
        logger.logLevel = this.logLevel;
        logger.enableColor = this.enableColor;
        logger._prefix = prefix;
        return logger;
    }

    debug(...args) {
        this.logBackend(LogLevel.Debug, args);
    }

    log(...args) {
        this.logBackend(LogLevel.Log, args);
    }

    warn(...args) {
        this.logBackend(LogLevel.Warn, args);
    }

    error(...args) {
        this.logBackend(LogLevel.Error, args);
    }

    logBackend(logLevel, args) {
        if (this.logLevel > logLevel) {
            return;
        }
        this.logTo(this.formatLog(logLevel, [this.format, ...this._prefix, args]));
    }

    get format() {
        let len = this._prefix.length;
        return new Array(len).fill('%prefix').join(' ') + (len === 0 ? '%message' : '%_message');
    }

    formatLog(logLevel, args) {
        let [format = ''] = args;
        let ptr = 1;
        return format.replace(/%(%|_?[a-zA-Z]+_?)/g, (m, p) => {
            if (p === '%') {
                return '%';
            }
            let start_ = p.at(0) === '_';
            p = start_ ? p.slice(1) : p;
            let end_ = p.at(-1) === '_';
            p = end_ ? p.slice(0, -1) : p;
            let formatter = this.formatter[p];
            let line = formatter(args, ptr++, logLevel, this);
            if (line === '') {
                return '';
            }
            return (start_ ? ' ' : '') + line + (end_ ? ' ' : '');
        });
    }
}



export const formatter = {
    /* string */
    s(args, ptr) {
        let arg = args[ptr];
        return arg.toString();
    },
    /* integer */
    i(args, ptr) {
        let arg = args[ptr];
        return Number(arg).toFixed();
    },
    /* json */
    j(args, ptr) {
        let arg = args[ptr];
        return JSON.stringify(arg);
    },
    /* recursive */
    r(args, ptr, logLevel, logger) {
        let arg = args[ptr];
        return logger.formatLog(logLevel, arg);
    },
    get prefix() {
        return this.r;
    },
    get message() {
        return this.r;
    },
    /* log level color */
    llc(args, ptr, logLevel, logger) {
        let arg = args[ptr];
        arg = logger.formatLog(logLevel, toArray(arg));
        if (!logger.enableColor) {
            return arg;
        }
        let color = logLevelColor[logLevel];
        return toColorWrapper(color)(arg);
    },
    /* log level text */
    llt(args, ptr, logLevel) {
        return logLevelText[logLevel];
    },
    color(args, ptr, logLevel, logger) {
        let arg = args[ptr];
        let [color] = arg;
        arg = logger.formatLog(logLevel, arg.slice(1));
        if (!logger.enableColor) {
            return arg;
        }
        return toColorWrapper(color)(arg);
    },
    ...newObj(colorList, (k) => {
        let colorWrapper = toColorWrapper(k);
        return (args, ptr, logLevel, logger) => {
            let arg = args[ptr];
            arg = logger.formatLog(logLevel, toArray(arg));
            if (!logger.enableColor) {
                return arg;
            }
            return colorWrapper(arg);
        };
    }),
};

function toColorWrapper(color) {
    color = toArray(color);
    let map = (idx) => (color) => `\u001B[${colorList[color][idx]}m`;
    let start = color.map(map(0)).join('');
    let finish = color.map(map(1)).join('');
    return (input) => start + input + finish;
}
