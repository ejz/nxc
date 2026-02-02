import test from 'tape';

import Logger, {LogLevel} from '../src/Logger.js';

test('Logger / 1', (t) => {
    let col;
    let logger = new Logger((msg) => col.push(msg));
    let go = (cases) => {
        for (let [calls, exp] of cases) {
            col = [];
            calls.forEach((call) => {
                logger[call.shift()](...call);
            });
            t.deepEqual(col, exp);
        }
    };
    logger.logLevel = LogLevel.Debug;
    go([
        [
            [['debug', 'foo1']],
            ['foo1'],
        ],
        [
            [['error', 'foo2']],
            ['foo2'],
        ],
    ]);
    logger.logLevel = LogLevel.Warn;
    go([
        [
            [['debug', 'foo3']],
            [],
        ],
        [
            [['log', 'foo4']],
            [],
        ],
        [
            [['warn', 'foo5']],
            ['foo5'],
        ],
        [
            [['error', 'foo6']],
            ['foo6'],
        ],
    ]);
    t.end();
});

test('Logger / 2', (t) => {
    let col;
    let logger = new Logger((msg) => col.push(msg));
    let cases = [
        [
            [['log']],
            [''],
        ],
        [
            [['log', 'hi']],
            ['hi'],
        ],
        [
            [['log', 'hi %%']],
            ['hi %'],
        ],
        [
            [['log', 'hi %s', 'bob']],
            ['hi bob'],
        ],
    ];
    for (let [calls, exp] of cases) {
        col = [];
        calls.forEach((call) => {
            logger[call.shift()](...call);
        });
        t.deepEqual(col, exp);
    }
    t.end();
});

test('Logger / 3', (t) => {
    let logger = new Logger(() => {});
    t.throws(() => logger.log('%aaa'));
    t.throws(() => logger.log('%s'));
    t.throws(() => logger.log('%s', undefined));
    t.end();
});

test('Logger / 4', (t) => {
    let col = [];
    let logger = new Logger((msg) => col.push(msg));
    logger.log('1%_s', 'a');
    t.equal(col.shift(), '1 a');
    logger.log('2%_s', '');
    t.equal(col.shift(), '2');
    logger.log('%s_3', 'b');
    t.equal(col.shift(), 'b 3');
    logger.log('%s_4', '');
    t.equal(col.shift(), '4');
    t.end();
});
