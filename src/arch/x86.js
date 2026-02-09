export const register = {
    r32: ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'],
    r16: ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'],
    r8: ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'],
    sreg: ['es', 'cs', 'ss', 'ds', 'fs', 'gs'],
};

export const details = {
    name: 'x86',
    bits: 32,
};

export default {
    'add.8': [
        {opcode: '00', args: ['r/m8', 'r8']},
        {opcode: '02', args: ['r8', 'r/m8']},
        {opcode: '04', args: ['al', 'imm8']},
        {opcode: '80 /0', args: ['r/m8', 'imm8']},
    ],
    'add.16': [
        {opcode: '66 01', args: ['r/m16', 'r16']},
        {opcode: '66 03', args: ['r16', 'r/m16']},
        {opcode: '66 05', args: ['ax', 'imm16']},
        {opcode: '66 81 /0', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /0', args: ['r/m16', 'imm8']},
    ],
    'add.32': [
        {opcode: '01', args: ['r/m32', 'r32']},
        {opcode: '03', args: ['r32', 'r/m32']},
        {opcode: '05', args: ['eax', 'imm32']},
        {opcode: '81 /0', args: ['r/m32', 'imm32']},
        {opcode: '83 /0', args: ['r/m32', 'imm8']},
    ],
    'and.8': [
        {opcode: '20', args: ['r/m8', 'r8']},
        {opcode: '22', args: ['r8', 'r/m8']},
        {opcode: '24', args: ['al', 'imm8']},
        {opcode: '80 /4', args: ['r/m8', 'imm8']},
    ],
    'and.16': [
        {opcode: '66 21', args: ['r/m16', 'r16']},
        {opcode: '66 23', args: ['r16', 'r/m16']},
        {opcode: '66 25', args: ['ax', 'imm16']},
        {opcode: '66 81 /4', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /4', args: ['r/m16', 'imm8']},
    ],
    'and.32': [
        {opcode: '21', args: ['r/m32', 'r32']},
        {opcode: '23', args: ['r32', 'r/m32']},
        {opcode: '25', args: ['eax', 'imm32']},
        {opcode: '81 /4', args: ['r/m32', 'imm32']},
        {opcode: '83 /4', args: ['r/m32', 'imm8']},
    ],
    'cmp.8': [
        {opcode: '38', args: ['r/m8', 'r8']},
        {opcode: '3a', args: ['r8', 'r/m8']},
        {opcode: '3c', args: ['al', 'imm8']},
        {opcode: '80 /7', args: ['r/m8', 'imm8']},
    ],
    'cmp.16': [
        {opcode: '66 39', args: ['r/m16', 'r16']},
        {opcode: '66 3b', args: ['r16', 'r/m16']},
        {opcode: '66 3d', args: ['ax', 'imm16']},
        {opcode: '66 81 /7', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /7', args: ['r/m16', 'imm8']},
    ],
    'cmp.32': [
        {opcode: '39', args: ['r/m32', 'r32']},
        {opcode: '3b', args: ['r32', 'r/m32']},
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
        {opcode: '08', args: ['r/m8', 'r8']},
        {opcode: '0a', args: ['r8', 'r/m8']},
        {opcode: '0c', args: ['al', 'imm8']},
        {opcode: '80 /1', args: ['r/m8', 'imm8']},
    ],
    'or.16': [
        {opcode: '66 09', args: ['r/m16', 'r16']},
        {opcode: '66 0b', args: ['r16', 'r/m16']},
        {opcode: '66 0d', args: ['ax', 'imm16']},
        {opcode: '66 81 /1', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /1', args: ['r/m16', 'imm8']},
    ],
    'or.32': [
        {opcode: '09', args: ['r/m32', 'r32']},
        {opcode: '0b', args: ['r32', 'r/m32']},
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
        {opcode: '28', args: ['r/m8', 'r8']},
        {opcode: '2a', args: ['r8', 'r/m8']},
        {opcode: '2c', args: ['al', 'imm8']},
        {opcode: '80 /5', args: ['r/m8', 'imm8']},
    ],
    'sub.16': [
        {opcode: '66 29', args: ['r/m16', 'r16']},
        {opcode: '66 2b', args: ['r16', 'r/m16']},
        {opcode: '66 2d', args: ['ax', 'imm16']},
        {opcode: '66 81 /5', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /5', args: ['r/m16', 'imm8']},
    ],
    'sub.32': [
        {opcode: '29', args: ['r/m32', 'r32']},
        {opcode: '2b', args: ['r32', 'r/m32']},
        {opcode: '2d', args: ['eax', 'imm32']},
        {opcode: '81 /5', args: ['r/m32', 'imm32']},
        {opcode: '83 /5', args: ['r/m32', 'imm8']},
    ],
    'xor.8': [
        {opcode: '30', args: ['r/m8', 'r8']},
        {opcode: '32', args: ['r8', 'r/m8']},
        {opcode: '34', args: ['al', 'imm8']},
        {opcode: '80 /6', args: ['r/m8', 'imm8']},
    ],
    'xor.16': [
        {opcode: '66 31', args: ['r/m16', 'r16']},
        {opcode: '66 33', args: ['r16', 'r/m16']},
        {opcode: '66 35', args: ['ax', 'imm16']},
        {opcode: '66 81 /6', args: ['r/m16', 'imm16']},
        {opcode: '66 83 /6', args: ['r/m16', 'imm8']},
    ],
    'xor.32': [
        {opcode: '31', args: ['r/m32', 'r32']},
        {opcode: '33', args: ['r32', 'r/m32']},
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
};
