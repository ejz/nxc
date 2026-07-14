import os from 'node:os';
import path from 'node:path';

export default function tmp(prefix = '', postfix = '') {
    return path.join(os.tmpdir(), prefix + Math.random().toString().slice(-8) + postfix);
}
