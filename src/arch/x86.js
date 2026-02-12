import {format} from 'node:util';

import * as types from '../types.js';

export const arch = {
    name: 'x86',
    bits: 32,
    scales: ['1', '2', '4', '8'],
    opsizes: ['8', '16', '32'],
};

export const register = {
    r32: ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'],
    r16: ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'],
    r8: ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'],
    sreg: ['es', 'cs', 'ss', 'ds', 'fs', 'gs'],
    syscall: ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp'],
};

export const mnemo = {
    'add.8': [
        {opcode: '00 /r', args: ['r/m8', 'r8']},
        {opcode: '02 /r', args: ['r8', 'r/m8']},
        {opcode: '04', args: ['al', 'imm8']},
        {opcode: '80 /0', args: ['r/m8', 'imm8']},
    ],
    'add.16': [
        {opcode: '66 01 /r', args: ['r/m16', 'r16']},
        {opcode: '66 03 /r', args: ['r16', 'r/m16']},
        {opcode: '66 05', args: ['ax', 'imm16']},
        {opcode: '66 81 /0', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /0', args: ['r/m16', 'imm8']},
    ],
    'add.32': [
        {opcode: '01 /r', args: ['r/m32', 'r32']},
        {opcode: '03 /r', args: ['r32', 'r/m32']},
        {opcode: '05', args: ['eax', 'imm32']},
        {opcode: '81 /0', args: ['r/m32', 'imm32']},
        {opcode: '83 /0', args: ['r/m32', 'imm8']},
    ],
    'and.8': [
        {opcode: '20 /r', args: ['r/m8', 'r8']},
        {opcode: '22 /r', args: ['r8', 'r/m8']},
        {opcode: '24', args: ['al', 'imm8']},
        {opcode: '80 /4', args: ['r/m8', 'imm8']},
    ],
    'and.16': [
        {opcode: '66 21 /r', args: ['r/m16', 'r16']},
        {opcode: '66 23 /r', args: ['r16', 'r/m16']},
        {opcode: '66 25', args: ['ax', 'imm16']},
        {opcode: '66 81 /4', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /4', args: ['r/m16', 'imm8']},
    ],
    'and.32': [
        {opcode: '21 /r', args: ['r/m32', 'r32']},
        {opcode: '23 /r', args: ['r32', 'r/m32']},
        {opcode: '25', args: ['eax', 'imm32']},
        {opcode: '81 /4', args: ['r/m32', 'imm32']},
        {opcode: '83 /4', args: ['r/m32', 'imm8']},
    ],
    'cmp.8': [
        {opcode: '38 /r', args: ['r/m8', 'r8']},
        {opcode: '3a /r', args: ['r8', 'r/m8']},
        {opcode: '3c', args: ['al', 'imm8']},
        {opcode: '80 /7', args: ['r/m8', 'imm8']},
    ],
    'cmp.16': [
        {opcode: '66 39 /r', args: ['r/m16', 'r16']},
        {opcode: '66 3b /r', args: ['r16', 'r/m16']},
        {opcode: '66 3d', args: ['ax', 'imm16']},
        {opcode: '66 81 /7', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /7', args: ['r/m16', 'imm8']},
    ],
    'cmp.32': [
        {opcode: '39 /r', args: ['r/m32', 'r32']},
        {opcode: '3b /r', args: ['r32', 'r/m32']},
        {opcode: '3d', args: ['eax', 'imm32']},
        {opcode: '81 /7', args: ['r/m32', 'imm32']},
        {opcode: '83 /7', args: ['r/m32', 'imm8']},
    ],
    'neg.8': [
        {opcode: 'f6 /3', args: ['r/m8']},
    ],
    'neg.16': [
        {opcode: '66 f7 /3', args: ['r/m16']},
    ],
    'neg.32': [
        {opcode: 'f7 /3', args: ['r/m32']},
    ],
    'not.8': [
        {opcode: 'f6 /2', args: ['r/m8']},
    ],
    'not.16': [
        {opcode: '66 f7 /2', args: ['r/m16']},
    ],
    'not.32': [
        {opcode: 'f7 /2', args: ['r/m32']},
    ],
    'or.8': [
        {opcode: '08 /r', args: ['r/m8', 'r8']},
        {opcode: '0a /r', args: ['r8', 'r/m8']},
        {opcode: '0c', args: ['al', 'imm8']},
        {opcode: '80 /1', args: ['r/m8', 'imm8']},
    ],
    'or.16': [
        {opcode: '66 09 /r', args: ['r/m16', 'r16']},
        {opcode: '66 0b /r', args: ['r16', 'r/m16']},
        {opcode: '66 0d', args: ['ax', 'imm16']},
        {opcode: '66 81 /1', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /1', args: ['r/m16', 'imm8']},
    ],
    'or.32': [
        {opcode: '09 /r', args: ['r/m32', 'r32']},
        {opcode: '0b /r', args: ['r32', 'r/m32']},
        {opcode: '0d', args: ['eax', 'imm32']},
        {opcode: '81 /1', args: ['r/m32', 'imm32']},
        {opcode: '83 /1', args: ['r/m32', 'imm8']},
    ],
    'int': [
        {opcode: 'cc', args: ['3']},
        {opcode: 'cd', args: ['imm8']},
    ],
    'iret': [
        {opcode: 'cf', args: []},
    ],
    'sub.8': [
        {opcode: '28 /r', args: ['r/m8', 'r8']},
        {opcode: '2a /r', args: ['r8', 'r/m8']},
        {opcode: '2c', args: ['al', 'imm8']},
        {opcode: '80 /5', args: ['r/m8', 'imm8']},
    ],
    'sub.16': [
        {opcode: '66 29 /r', args: ['r/m16', 'r16']},
        {opcode: '66 2b /r', args: ['r16', 'r/m16']},
        {opcode: '66 2d', args: ['ax', 'imm16']},
        {opcode: '66 81 /5', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /5', args: ['r/m16', 'imm8']},
    ],
    'sub.32': [
        {opcode: '29 /r', args: ['r/m32', 'r32']},
        {opcode: '2b /r', args: ['r32', 'r/m32']},
        {opcode: '2d', args: ['eax', 'imm32']},
        {opcode: '81 /5', args: ['r/m32', 'imm32']},
        {opcode: '83 /5', args: ['r/m32', 'imm8']},
    ],
    'xor.8': [
        {opcode: '30 /r', args: ['r/m8', 'r8']},
        {opcode: '32 /r', args: ['r8', 'r/m8']},
        {opcode: '34', args: ['al', 'imm8']},
        {opcode: '80 /6', args: ['r/m8', 'imm8']},
    ],
    'xor.16': [
        {opcode: '66 31 /r', args: ['r/m16', 'r16']},
        {opcode: '66 33 /r', args: ['r16', 'r/m16']},
        {opcode: '66 35', args: ['ax', 'imm16']},
        {opcode: '66 81 /6', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /6', args: ['r/m16', 'imm8']},
    ],
    'xor.32': [
        {opcode: '31 /r', args: ['r/m32', 'r32']},
        {opcode: '33 /r', args: ['r32', 'r/m32']},
        {opcode: '35', args: ['eax', 'imm32']},
        {opcode: '81 /6', args: ['r/m32', 'imm32']},
        {opcode: '83 /6', args: ['r/m32', 'imm8']},
    ],
    'call.16': [
        {opcode: '66 e8', args: ['rel16']},
        {opcode: '67 ff /2', args: ['r/m16']},
    ],
    'call.32': [
        {opcode: 'e8', args: ['rel32']},
        {opcode: 'ff /2', args: ['r/m32']},
    ],
    'callf.16': [
        {opcode: '66 9a', args: ['ptr16:16']},
        {opcode: '67 ff /3', args: ['m16:16']},
    ],
    'callf.32': [
        {opcode: '9a', args: ['ptr16:32']},
        {opcode: 'ff /3', args: ['m16:32']},
    ],
    'jmp.8': [
        {opcode: 'eb', args: ['rel8']},
    ],
    'jmp.16': [
        {opcode: '66 e9', args: ['rel16']},
        {opcode: '67 ff /4', args: ['r/m16']},
    ],
    'jmp.32': [
        {opcode: 'e9', args: ['rel32']},
        {opcode: 'ff /4', args: ['r/m32']},
    ],
    'jmpf.16': [
        {opcode: '66 ea', args: ['ptr16:16']},
        {opcode: '67 ff /5', args: ['m16:16']},
    ],
    'jmpf.32': [
        {opcode: 'ea', args: ['ptr16:32']},
        {opcode: 'ff /5', args: ['m16:32']},
    ],
    'pushf.16': [
        {opcode: '66 9c', args: []},
    ],
    'pushf.32': [
        {opcode: '9c', args: []},
    ],
    'popf.16': [
        {opcode: '66 9d', args: []},
    ],
    'popf.32': [
        {opcode: '9d', args: []},
    ],
    'push.8': [
        {opcode: '6a', args: ['imm8']},
    ],
    'push.16': [
        {opcode: '06', args: ['es']},
        {opcode: '0e', args: ['cs']},
        {opcode: '0f a0', args: ['fs']},
        {opcode: '0f a8', args: ['gs']},
        {opcode: '16', args: ['ss']},
        {opcode: '1e', args: ['ds']},
        {opcode: '66 50', args: ['ax']},
        {opcode: '66 51', args: ['cx']},
        {opcode: '66 52', args: ['dx']},
        {opcode: '66 53', args: ['bx']},
        {opcode: '66 54', args: ['sp']},
        {opcode: '66 55', args: ['bp']},
        {opcode: '66 56', args: ['si']},
        {opcode: '66 57', args: ['di']},
        // {opcode: '66 6a', args: ['imm16']},
        {opcode: '66 68', args: ['imm16']},
        {opcode: '66 ff /6', args: ['r/m16']},
    ],
    'push.32': [
        {opcode: '50', args: ['eax']},
        {opcode: '51', args: ['ecx']},
        {opcode: '52', args: ['edx']},
        {opcode: '53', args: ['ebx']},
        {opcode: '54', args: ['esp']},
        {opcode: '55', args: ['ebp']},
        {opcode: '56', args: ['esi']},
        {opcode: '57', args: ['edi']},
        {opcode: '68', args: ['imm32']},
        {opcode: 'ff /6', args: ['r/m32']},
    ],
    'pop.16': [
        {opcode: '07', args: ['es']},
        {opcode: '0f a1', args: ['fs']},
        {opcode: '0f a9', args: ['gs']},
        {opcode: '17', args: ['ss']},
        {opcode: '1f', args: ['ds']},
        {opcode: '66 58', args: ['ax']},
        {opcode: '66 59', args: ['cx']},
        {opcode: '66 5a', args: ['dx']},
        {opcode: '66 5b', args: ['bx']},
        {opcode: '66 5c', args: ['sp']},
        {opcode: '66 5d', args: ['bp']},
        {opcode: '66 5e', args: ['si']},
        {opcode: '66 5f', args: ['di']},
        {opcode: '66 8f /0', args: ['r/m16']},
    ],
    'pop.32': [
        {opcode: '58', args: ['eax']},
        {opcode: '59', args: ['ecx']},
        {opcode: '5a', args: ['edx']},
        {opcode: '5b', args: ['ebx']},
        {opcode: '5c', args: ['esp']},
        {opcode: '5d', args: ['ebp']},
        {opcode: '5e', args: ['esi']},
        {opcode: '5f', args: ['edi']},
        {opcode: '8f /0', args: ['r/m32']},
    ],
    'mov.8': [
        {opcode: '88 /r', args: ['r/m8', 'r8']},
        {opcode: '8a /r', args: ['r8', 'r/m8']},
        {opcode: 'b0', args: ['al', 'imm8']},
        {opcode: 'b1', args: ['cl', 'imm8']},
        {opcode: 'b2', args: ['dl', 'imm8']},
        {opcode: 'b3', args: ['bl', 'imm8']},
        {opcode: 'b4', args: ['ah', 'imm8']},
        {opcode: 'b5', args: ['ch', 'imm8']},
        {opcode: 'b6', args: ['dh', 'imm8']},
        {opcode: 'b7', args: ['bh', 'imm8']},
        {opcode: 'c6 /0', args: ['r/m8', 'imm8']},
    ],
    'mov.16': [
        {opcode: '66 89 /r', args: ['r/m16', 'r16']},
        {opcode: '66 8b /r', args: ['r16', 'r/m16']},
        {opcode: '66 b8', args: ['ax', 'imm16']},
        {opcode: '66 b9', args: ['cx', 'imm16']},
        {opcode: '66 ba', args: ['dx', 'imm16']},
        {opcode: '66 bb', args: ['bx', 'imm16']},
        {opcode: '66 bc', args: ['sp', 'imm16']},
        {opcode: '66 bd', args: ['bp', 'imm16']},
        {opcode: '66 be', args: ['si', 'imm16']},
        {opcode: '66 bf', args: ['di', 'imm16']},
        {opcode: '66 c7 /0', args: ['r/m16', 'imm16']},
    ],
    'mov.32': [
        {opcode: '89 /r', args: ['r/m32', 'r32']},
        {opcode: '8b /r', args: ['r32', 'r/m32']},
        {opcode: 'b8', args: ['eax', 'imm32']},
        {opcode: 'b9', args: ['ecx', 'imm32']},
        {opcode: 'ba', args: ['edx', 'imm32']},
        {opcode: 'bb', args: ['ebx', 'imm32']},
        {opcode: 'bc', args: ['esp', 'imm32']},
        {opcode: 'bd', args: ['ebp', 'imm32']},
        {opcode: 'be', args: ['esi', 'imm32']},
        {opcode: 'bf', args: ['edi', 'imm32']},
        {opcode: 'c7 /0', args: ['r/m32', 'imm32']},
    ],
    'inc.8': [
        {opcode: 'fe /0', args: ['r/m8']},
    ],
    'inc.16': [
        {opcode: '66 40', args: ['ax']},
        {opcode: '66 41', args: ['cx']},
        {opcode: '66 42', args: ['dx']},
        {opcode: '66 43', args: ['bx']},
        {opcode: '66 44', args: ['sp']},
        {opcode: '66 45', args: ['bp']},
        {opcode: '66 46', args: ['si']},
        {opcode: '66 47', args: ['di']},
        {opcode: '66 ff /0', args: ['r/m16']},
    ],
    'inc.32': [
        {opcode: '40', args: ['eax']},
        {opcode: '41', args: ['ecx']},
        {opcode: '42', args: ['edx']},
        {opcode: '43', args: ['ebx']},
        {opcode: '44', args: ['esp']},
        {opcode: '45', args: ['ebp']},
        {opcode: '46', args: ['esi']},
        {opcode: '47', args: ['edi']},
        {opcode: 'ff /0', args: ['r/m32']},
    ],
    'dec.8': [
        {opcode: 'fe /1', args: ['r/m8']},
    ],
    'dec.16': [
        {opcode: '66 48', args: ['ax']},
        {opcode: '66 49', args: ['cx']},
        {opcode: '66 4a', args: ['dx']},
        {opcode: '66 4b', args: ['bx']},
        {opcode: '66 4c', args: ['sp']},
        {opcode: '66 4d', args: ['bp']},
        {opcode: '66 4e', args: ['si']},
        {opcode: '66 4f', args: ['di']},
        {opcode: '66 ff /1', args: ['r/m16']},
    ],
    'dec.32': [
        {opcode: '48', args: ['eax']},
        {opcode: '49', args: ['ecx']},
        {opcode: '4a', args: ['edx']},
        {opcode: '4b', args: ['ebx']},
        {opcode: '4c', args: ['esp']},
        {opcode: '4d', args: ['ebp']},
        {opcode: '4e', args: ['esi']},
        {opcode: '4f', args: ['edi']},
        {opcode: 'ff /1', args: ['r/m32']},
    ],
};

export const alias = {
    'syscall': getSyscall(1, 'int 0x80', 'eax'),
    'syscall.exit': getSyscall(1, 0x1),
    'syscall.write': getSyscall(3, 0x4),
};

export const operation = {
    '=': 'mov $0, $1',
};

export const resolver = {
    '0': rawClosure(0),
    '1': rawClosure(1),
    '2': rawClosure(2),
    '3': rawClosure(3),
    'imm8': immClosure(types.u8, types.i8),
    'imm16': immClosure(types.u16, types.i16),
    'imm32': immClosure(types.u32, types.i32),
    ...Object.fromEntries(register.sreg.map(regClosure)),
    ...Object.fromEntries(register.r8.map(regClosure)),
    ...Object.fromEntries(register.r16.map(regClosure)),
    ...Object.fromEntries(register.r32.map(regClosure)),
    'r8': rmClosure(register.r8, false),
    'r16': rmClosure(register.r16, false),
    'r32': rmClosure(register.r32, false),
    'r/m8': rmClosure(register.r8, true),
    'r/m16': rmClosure(register.r16, true),
    'r/m32': rmClosure(register.r32, true),
};

export function toBuffer({opcode, args}, asmArgs) {
    let buf = [];
    opcode.split(' ').forEach((op) => {
        let [o, t] = op;
        if (o !== '/') {
            buf.push(parseInt(op, 16));
            return;
        }
        buf.modRmIdx = buf.length;
        buf.push(0);
        buf.sibIdx = buf.length;
        Object.assign(buf, {
            setRm,
            setReg,
            setMod,
            setScale,
            setIndex,
            setBase,
        });
        if (t !== 'r') {
            buf.setReg(parseInt(t));
        }
    });
    args.forEach((arg, i) => {
        let [, getter = null] = resolver[arg];
        if (getter === null) {
            return;
        }
        buf.push(...getter(asmArgs[i], buf));
    });
    return Buffer.from(buf);
}

export default {
    ...arch,
    mnemo,
    alias,
    operation,
    resolver,
    toBuffer,
};

export function immClosure(uN, iN) {
    let resolver = ({type: t, integer: i, self}) => {
        if (t !== 'integer') {
            return false;
        }
        let int = parseInt(i);
        if (uN.is(int)) {
            self.int = int;
            self.imm = uN;
            return true;
        }
        if (iN.is(int)) {
            self.int = int;
            self.imm = iN;
            return true;
        }
        return false;
    };
    let composer = ({imm, int: i}) => {
        let buf = Buffer.allocUnsafe(imm.size);
        buf[imm.method](i);
        return [...buf];
    };
    return [resolver, composer];
}

export function rawClosure(int) {
    let resolver = ({type: t, integer: i}) => {
        if (t !== 'integer') {
            return false;
        }
        let v = parseInt(i);
        return v === int;
    };
    return [resolver];
}

export function regClosure(reg) {
    let resolver = ({type: t, register: r}) => {
        if (t !== 'register') {
            return false;
        }
        return r === reg;
    };
    return [reg, [resolver]];
}

export function rmClosure(reg, mode) {
    let resolver = ({type: t, register: r, sib: s}) => {
        if (t === 'register' && reg.includes(r)) {
            return true;
        }
        if (mode && t === 'sib' && isSibOkay(s)) {
            return true;
        }
        return false;
    };
    let composer = ({type: t, register: r, sib: s}, buf) => {
        if (t === 'register') {
            if (mode) {
                buf.setMod('reg');
                buf.setRm(r);
            } else {
                buf.setReg(r);
            }
            return [];
        }
        // special cases:
        // 1) disp32 = ebp + disp0
        // 2) ebp + disp0 = ebp + disp8
        // 3) [esp] -> forced sib
        // 4) swap [ebp + esp] -> [esp + ebp]
        // 5) [eax * 1] -> [eax]
        let [def] = arch.scales;
        let {scale, base, index, disp} = s;
        if (scale === null && index === 'esp' && base !== 'esp') {
            [index, base] = [base, index];
        }
        if (index === 'esp') {
            throw new Error;
        }
        if (scale === def && index !== null && base === null) {
            base = index;
            [index, scale] = [null, null];
        }
        disp ??= 0;
        let dispMode = disp === 0 && base !== 'ebp' ? 'disp0' : types.i8.is(disp) ? 'disp8' : 'disp32';
        if (index === null && base !== 'esp') {
            buf.setRm(base ?? 'ebp');
        } else {
            buf.setRm('esp');
            buf.push(0); // sib
            buf.setScale(scale ?? def);
            buf.setIndex(index ?? 'esp');
            buf.setBase(base ?? 'ebp');
        }
        buf.setMod(base === null ? 'disp0' : dispMode);
        return disp2buffer(disp, base === null ? 'disp32' : dispMode);
    };
    return [resolver, composer];
}

export function isSibOkay(sib) {
    let {scale, base, index, disp, minus, self} = sib;
    if (scale !== null && !arch.scales.includes(scale)) {
        return false;
    }
    if (base !== null && !register.r32.includes(base)) {
        return false;
    }
    if (index !== null && !register.r32.includes(index)) {
        return false;
    }
    if (disp !== null) {
        let int = parseInt(disp);
        int = minus ? -int : int;
        if (!types.i32.is(int)) {
            return false;
        }
        self.disp = int;
        return true;
    }
    return base !== null || index !== null;
}

const reverseKeyValue = ([key, value]) => [value, key];

export const rmRegDict = {
    ...Object.fromEntries([...register.r32.entries()].map(reverseKeyValue)),
    ...Object.fromEntries([...register.r16.entries()].map(reverseKeyValue)),
    ...Object.fromEntries([...register.r8.entries()].map(reverseKeyValue)),
};

export function setRm(val) {
    val = rmRegDict[val];
    this[this.modRmIdx] += val << 0;
}

export function setReg(val) {
    val = typeof val === 'string' ? rmRegDict[val] : val;
    this[this.modRmIdx] += val << 3;
}

export const modDict = {
    'disp0':  0b00,
    'disp8':  0b01,
    'disp32': 0b10,
    'reg':    0b11,
};

export function setMod(val) {
    this[this.modRmIdx] += modDict[val] << 6;
}

export function setBase(val) {
    val = rmRegDict[val];
    this[this.sibIdx] += val << 0;
}

export function setIndex(val) {
    val = rmRegDict[val];
    this[this.sibIdx] += val << 3;
}

export function setScale(val) {
    val = arch.scales.indexOf(val);
    this[this.sibIdx] += val << 6;
}

export function disp2buffer(disp, mode) {
    switch (mode) {
        case 'disp0':
            return [];
        case 'disp8': {
            let buffer = Buffer.allocUnsafe(types.i8.size);
            buffer[types.i8.method](disp);
            return [...buffer];
        }
        case 'disp32': {
            let buffer = Buffer.allocUnsafe(types.i32.size);
            buffer[types.i32.method](disp);
            return [...buffer];
        }
    }
    throw new Error;
}

export function getSyscall(nargs, instr, first = 'ebx') {
    instr = typeof instr === 'string' ? instr : 'syscall ' + instr.toString();
    let idx = register.syscall.indexOf(first);
    let args = register.syscall.slice(idx, idx + nargs);
    let map = (reg, i) => format('%s = $%s', reg, i);
    let alias = args.map(map).concat(instr);
    return {alias, nargs};
}
