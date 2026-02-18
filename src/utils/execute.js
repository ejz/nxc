import child_process from 'node:child_process';

export default function execute(cmd, {
    shell = false,
    stdio = ['ignore', 'pipe', 'ignore'],
    ...rest
}) {
    let bin = cmd.shift();
    let child = child_process.spawn(bin, cmd, {shell, stdio, ...rest});
    let stdout = [];
    child.stdout.on('data', (buffer) => stdout.push(buffer));
    let resolve, reject;
    let promise = new Promise((res, rej) => (resolve = res, reject = rej));
    let finish = (error, code) => {
        child.removeAllListeners();
        if (error !== null) {
            reject(error);
            return;
        }
        resolve({
            code,
            stdout: Buffer.concat(stdout),
            killed: child.killed,
        });
    };
    child.on('close', (code) => finish(null, code));
    child.on('exit', (code) => finish(null, code));
    child.on('error', (error) => finish(error, null));
    return {
        child,
        promise,
        get stdout() {
            return stdout;
        },
    };
}
