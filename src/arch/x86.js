import {format} from 'node:util';

import * as types from '../types.js';

export const arch = {
    name: 'x86',
    bits: 32,
    scales: ['1', '2', '4', '8'],
    opsizes: ['8', '16', '32'],
    operations: ['=', '++', '--', '!='],
    finalExit: 'syscall.exit',
};

export const register = {
    r32: ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'],
    r16: ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'],
    r8: ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'],
    sreg: ['es', 'cs', 'ss', 'ds', 'fs', 'gs'],
    syscall: ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp'],
    data: 'ds',
};

export const isa = {
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
    'jmp': {alias: 'jmp.8 $0', args: 1},
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
        {opcode: 'a0', args: ['al', 'moffs8']},
        {opcode: 'a2', args: ['moffs8', 'al']},
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
        {opcode: '66 a1', args: ['ax', 'moffs16']},
        {opcode: '66 a3', args: ['moffs16', 'ax']},
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
        {opcode: 'a1', args: ['eax', 'moffs32']},
        {opcode: 'a3', args: ['moffs32', 'eax']},
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
    'hlt': [
        {opcode: 'f4', args: []},
    ],
    'lea.16': [
        {opcode: '66 8d /r', args: ['r16', 'm']},
    ],
    'lea.32': [
        {opcode: '8d /r', args: ['r32', 'm']},
    ],
    'rol.8': [
        {opcode: 'd0 /0', args: ['r/m8', '1']},
        {opcode: 'c0 /0', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /0', args: ['r/m8', 'cl']},
    ],
    'rol.16': [
        {opcode: '66 d1 /0', args: ['r/m16', '1']},
        {opcode: '66 c1 /0', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /0', args: ['r/m16', 'cl']},
    ],
    'rol.32': [
        {opcode: 'd1 /0', args: ['r/m32', '1']},
        {opcode: 'c1 /0', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /0', args: ['r/m32', 'cl']},
    ],
    'rcl.8': [
        {opcode: 'd0 /2', args: ['r/m8', '1']},
        {opcode: 'c0 /2', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /2', args: ['r/m8', 'cl']},
    ],
    'rcl.16': [
        {opcode: '66 d1 /2', args: ['r/m16', '1']},
        {opcode: '66 c1 /2', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /2', args: ['r/m16', 'cl']},
    ],
    'rcl.32': [
        {opcode: 'd1 /2', args: ['r/m32', '1']},
        {opcode: 'c1 /2', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /2', args: ['r/m32', 'cl']},
    ],
    'ror.8': [
        {opcode: 'd0 /1', args: ['r/m8', '1']},
        {opcode: 'c0 /1', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /1', args: ['r/m8', 'cl']},
    ],
    'ror.16': [
        {opcode: '66 d1 /1', args: ['r/m16', '1']},
        {opcode: '66 c1 /1', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /1', args: ['r/m16', 'cl']},
    ],
    'ror.32': [
        {opcode: 'd1 /1', args: ['r/m32', '1']},
        {opcode: 'c1 /1', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /1', args: ['r/m32', 'cl']},
    ],
    'rcr.8': [
        {opcode: 'd0 /3', args: ['r/m8', '1']},
        {opcode: 'c0 /3', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /3', args: ['r/m8', 'cl']},
    ],
    'rcr.16': [
        {opcode: '66 d1 /3', args: ['r/m16', '1']},
        {opcode: '66 c1 /3', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /3', args: ['r/m16', 'cl']},
    ],
    'rcr.32': [
        {opcode: 'd1 /3', args: ['r/m32', '1']},
        {opcode: 'c1 /3', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /3', args: ['r/m32', 'cl']},
    ],
    'shl.8': [
        {opcode: 'd0 /4', args: ['r/m8', '1']},
        {opcode: 'c0 /4', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /4', args: ['r/m8', 'cl']},
    ],
    'shl.16': [
        {opcode: '66 d1 /4', args: ['r/m16', '1']},
        {opcode: '66 c1 /4', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /4', args: ['r/m16', 'cl']},
    ],
    'shl.32': [
        {opcode: 'd1 /4', args: ['r/m32', '1']},
        {opcode: 'c1 /4', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /4', args: ['r/m32', 'cl']},
    ],
    'sar.8': [
        {opcode: 'd0 /7', args: ['r/m8', '1']},
        {opcode: 'c0 /7', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /7', args: ['r/m8', 'cl']},
    ],
    'sar.16': [
        {opcode: '66 d1 /7', args: ['r/m16', '1']},
        {opcode: '66 c1 /7', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /7', args: ['r/m16', 'cl']},
    ],
    'sar.32': [
        {opcode: 'd1 /7', args: ['r/m32', '1']},
        {opcode: 'c1 /7', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /7', args: ['r/m32', 'cl']},
    ],
    'shr.8': [
        {opcode: 'd0 /5', args: ['r/m8', '1']},
        {opcode: 'c0 /5', args: ['r/m8', 'imm8']},
        {opcode: 'd2 /5', args: ['r/m8', 'cl']},
    ],
    'shr.16': [
        {opcode: '66 d1 /5', args: ['r/m16', '1']},
        {opcode: '66 c1 /5', args: ['r/m16', 'imm8']},
        {opcode: '66 d3 /5', args: ['r/m16', 'cl']},
    ],
    'shr.32': [
        {opcode: 'd1 /5', args: ['r/m32', '1']},
        {opcode: 'c1 /5', args: ['r/m32', 'imm8']},
        {opcode: 'd3 /5', args: ['r/m32', 'cl']},
    ],
    'xchg.8': [
        {opcode: '86 /r', args: ['r8', 'r/m8']},
    ],
    'xchg.16': [
        {opcode: '66 87 /r', args: ['r16', 'r/m16']},
        {opcode: '66 90', args: ['ax', 'ax']},
        {opcode: '66 91', args: ['cx', 'ax']},
        {opcode: '66 91', args: ['ax', 'cx']},
        {opcode: '66 92', args: ['dx', 'ax']},
        {opcode: '66 92', args: ['ax', 'dx']},
        {opcode: '66 93', args: ['bx', 'ax']},
        {opcode: '66 93', args: ['ax', 'bx']},
        {opcode: '66 94', args: ['sp', 'ax']},
        {opcode: '66 94', args: ['ax', 'sp']},
        {opcode: '66 95', args: ['bp', 'ax']},
        {opcode: '66 95', args: ['ax', 'bp']},
        {opcode: '66 96', args: ['si', 'ax']},
        {opcode: '66 96', args: ['ax', 'si']},
        {opcode: '66 97', args: ['di', 'ax']},
        {opcode: '66 97', args: ['ax', 'di']},
    ],
    'xchg.32': [
        {opcode: '87 /r', args: ['r32', 'r/m32']},
        {opcode: '90', args: ['eax', 'eax']},
        {opcode: '91', args: ['ecx', 'eax']},
        {opcode: '91', args: ['eax', 'ecx']},
        {opcode: '92', args: ['edx', 'eax']},
        {opcode: '92', args: ['eax', 'edx']},
        {opcode: '93', args: ['ebx', 'eax']},
        {opcode: '93', args: ['eax', 'ebx']},
        {opcode: '94', args: ['esp', 'eax']},
        {opcode: '94', args: ['eax', 'esp']},
        {opcode: '95', args: ['ebp', 'eax']},
        {opcode: '95', args: ['eax', 'ebp']},
        {opcode: '96', args: ['esi', 'eax']},
        {opcode: '96', args: ['eax', 'esi']},
        {opcode: '97', args: ['edi', 'eax']},
        {opcode: '97', args: ['eax', 'edi']},
    ],
    'test.8': [
        {opcode: '84 /r', args: ['r/m8', 'r8']},
        {opcode: 'f6 /0', args: ['r/m8', 'imm8']},
        {opcode: 'a8', args: ['al', 'imm8']},
    ],
    'test.16': [
        {opcode: '66 85 /r', args: ['r/m16', 'r16']},
        {opcode: '66 a9', args: ['ax', 'imm16']},
        {opcode: '66 f7 /0', args: ['r/m16', 'imm16']},
    ],
    'test.32': [
        {opcode: '85 /r', args: ['r/m32', 'r32']},
        {opcode: 'a9', args: ['eax', 'imm32']},
        {opcode: 'f7 /0', args: ['r/m32', 'imm32']},
    ],
    'cmc': {opcode: 'f5', args: []},
    'clc': {opcode: 'f8', args: []},
    'stc': {opcode: 'f9', args: []},
    'cli': {opcode: 'fa', args: []},
    'sti': {opcode: 'fb', args: []},
    'cld': {opcode: 'fc', args: []},
    'std': {opcode: 'fd', args: []},
    'ja': {alias: 'ja.8 $0', args: 1},
    'ja.8': {opcode: '77', args: ['rel8']},
    'ja.16': {opcode: '66 0f 87', args: ['rel16']},
    'ja.32': {opcode: '0f 87', args: ['rel32']},
    'jae': {alias: 'jae.8 $0', args: 1},
    'jae.8': {opcode: '73', args: ['rel8']},
    'jae.16': {opcode: '66 0f 83', args: ['rel16']},
    'jae.32': {opcode: '0f 83', args: ['rel32']},
    'jb': {alias: 'jb.8 $0', args: 1},
    'jb.8': {opcode: '72', args: ['rel8']},
    'jb.16': {opcode: '66 0f 82', args: ['rel16']},
    'jb.32': {opcode: '0f 82', args: ['rel32']},
    'jbe': {alias: 'jbe.8 $0', args: 1},
    'jbe.8': {opcode: '76', args: ['rel8']},
    'jbe.16': {opcode: '66 0f 86', args: ['rel16']},
    'jbe.32': {opcode: '0f 86', args: ['rel32']},
    'jcxz': {opcode: '67 e3', args: ['rel8']},
    'jecxz': {opcode: 'e3', args: ['rel8']},
    'je': {alias: 'je.8 $0', args: 1},
    'je.8': {opcode: '74', args: ['rel8']},
    'je.16': {opcode: '66 0f 84', args: ['rel16']},
    'je.32': {opcode: '0f 84', args: ['rel32']},
    'jg': {alias: 'jg.8 $0', args: 1},
    'jg.8': {opcode: '7f', args: ['rel8']},
    'jg.16': {opcode: '66 0f 8f', args: ['rel16']},
    'jg.32': {opcode: '0f 8f', args: ['rel32']},
    'jge': {alias: 'jge.8 $0', args: 1},
    'jge.8': {opcode: '7d', args: ['rel8']},
    'jge.16': {opcode: '66 0f 8d', args: ['rel16']},
    'jge.32': {opcode: '0f 8d', args: ['rel32']},
    'jl': {alias: 'jl.8 $0', args: 1},
    'jl.8': {opcode: '7c', args: ['rel8']},
    'jl.16': {opcode: '66 0f 8c', args: ['rel16']},
    'jl.32': {opcode: '0f 8c', args: ['rel32']},
    'jle': {alias: 'jle.8 $0', args: 1},
    'jle.8': {opcode: '7e', args: ['rel8']},
    'jle.16': {opcode: '66 0f 8e', args: ['rel16']},
    'jle.32': {opcode: '0f 8e', args: ['rel32']},
    'jne': {alias: 'jne.8 $0', args: 1},
    'jne.8': {opcode: '75', args: ['rel8']},
    'jne.16': {opcode: '66 0f 85', args: ['rel16']},
    'jne.32': {opcode: '0f 85', args: ['rel32']},
    'jno': {alias: 'jno.8 $0', args: 1},
    'jno.8': {opcode: '71', args: ['rel8']},
    'jno.16': {opcode: '66 0f 81', args: ['rel16']},
    'jno.32': {opcode: '0f 81', args: ['rel32']},
    'jnp': {alias: 'jnp.8 $0', args: 1},
    'jnp.8': {opcode: '7b', args: ['rel8']},
    'jnp.16': {opcode: '66 0f 8b', args: ['rel16']},
    'jnp.32': {opcode: '0f 8b', args: ['rel32']},
    'jns': {alias: 'jns.8 $0', args: 1},
    'jns.8': {opcode: '79', args: ['rel8']},
    'jns.16': {opcode: '66 0f 89', args: ['rel16']},
    'jns.32': {opcode: '0f 89', args: ['rel32']},
    'jp': {alias: 'jp.8 $0', args: 1},
    'jp.8': {opcode: '7a', args: ['rel8']},
    'jp.16': {opcode: '66 0f 8a', args: ['rel16']},
    'jp.32': {opcode: '0f 8a', args: ['rel32']},
    'jo': {alias: 'jo.8 $0', args: 1},
    'jo.8': {opcode: '70', args: ['rel8']},
    'jo.16': {opcode: '66 0f 80', args: ['rel16']},
    'jo.32': {opcode: '0f 80', args: ['rel32']},
    'js': {alias: 'js.8 $0', args: 1},
    'js.8': {opcode: '78', args: ['rel8']},
    'js.16': {opcode: '66 0f 88', args: ['rel16']},
    'js.32': {opcode: '0f 88', args: ['rel32']},
    '=': [
        {alias: 'clc', args: ['cf', '0']},
        {alias: 'stc', args: ['cf', '1']},
        {alias: 'cli', args: ['if', '0']},
        {alias: 'sti', args: ['if', '1']},
        {alias: 'cld', args: ['df', '0']},
        {alias: 'std', args: ['df', '1']},
        {alias: 'xor $0, $0', args: ['any', '0']},
        {alias: 'mov $0, $1', args: 2},
    ],
    '!=': {alias: 'cmc', args: ['cf', 'cf']},
    '--': {alias: 'dec $0', args: ['any']},
    '++': {alias: 'inc $0', args: ['any']},
    'nop': [
        {alias: 'xchg eax, eax', args: 0},
        {alias: ([{int}]) => new Array(int).fill('nop'), args: ['u16']},
    ],
    'syscall': getSyscallAlias(1, 'int 0x80', 'eax'),
    'syscall.exit': [
        getSyscallAlias(0, 'syscall.exit 0'),
        getSyscallAlias(1, 0x1),
    ],
    'syscall.write': [
        {alias: 'syscall.write 1, $1, $2', args: ['stdout', 'any', 'any']},
        {alias: 'syscall.write 2, $1, $2', args: ['stderr', 'any', 'any']},
        getSyscallAlias(3, 0x4),
    ],
};

Object.assign(isa, fullAlias('sal', 'shl'));
Object.assign(isa, fullAlias('jnbe', 'ja'));
Object.assign(isa, fullAlias('jnb', 'jae'));
Object.assign(isa, fullAlias('jnc', 'jae'));
Object.assign(isa, fullAlias('jc', 'jb'));
Object.assign(isa, fullAlias('jnae', 'jb'));
Object.assign(isa, fullAlias('jna', 'jbe'));
Object.assign(isa, fullAlias('jecxz', 'jcxz'));
Object.assign(isa, fullAlias('jz', 'je'));
Object.assign(isa, fullAlias('jnle', 'jg'));
Object.assign(isa, fullAlias('jnl', 'jge'));
Object.assign(isa, fullAlias('jnge', 'jl'));
Object.assign(isa, fullAlias('jng', 'jle'));
Object.assign(isa, fullAlias('jnz', 'jne'));
Object.assign(isa, fullAlias('jpo', 'jnp'));
Object.assign(isa, fullAlias('jpe', 'jp'));

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
    'r8': rmClosure(register.r8),
    'r16': rmClosure(register.r16),
    'r32': rmClosure(register.r32),
    'r/m8': rmClosure(register.r8, true),
    'r/m16': rmClosure(register.r16, true),
    'r/m32': rmClosure(register.r32, true),
    'm': rmClosure([], true),
    'rel8': relClosure(types.i8),
    'rel16': relClosure(types.i16),
    'rel32': relClosure(types.i32),
    'u16': immClosure(types.u16),
    'any': [() => true],
    'moffs8': moffsClosure([null, register.data]),
    'moffs16': moffsClosure([null, register.data]),
    'moffs32': moffsClosure([null, register.data]),
    ...Object.fromEntries([
        'cf',
        'if',
        'df',
        'stdout',
        'stderr',
    ].map(regClosure)),
};

export function toBuffer({opcode, args}, asmArgs) {
    let opcodes = opcode.split(' ');
    let [o, t] = opcodes.at(-1);
    let hasMod = o === '/';
    if (hasMod) {
        opcodes.push('');
    }
    let opBuf = Buffer.from(opcodes.map((opcode) => {
        let hex = parseInt(opcode, 16);
        return isNaN(hex) ? 0 : hex;
    }));
    if (hasMod) {
        Object.assign(opBuf, {
            setRm,
            setReg,
            setMod,
            setScale,
            setIndex,
            setBase,
            useSib,
        });
        opBuf.useSib(false);
        if (t !== 'r') {
            t = parseInt(t);
            opBuf.setReg(t);
        }
    }
    let collect = [opBuf];
    args.forEach((arg, i) => {
        let [, composer = null] = resolver[arg];
        if (composer === null) {
            return;
        }
        let res = composer(asmArgs[i], opBuf);
        if (res !== null) {
            collect.push(res);
        }
    });
    if (hasMod && !opBuf.useSib()) {
        opBuf = opBuf.slice(0, -1);
        collect.splice(0, 1, opBuf);
    }
    return collect;
}

export default {
    ...arch,
    isa,
    resolver,
    toBuffer,
};

export function relClosure(iN) {
    let resolver = ({register = null, label = null}) => {
        return register !== null || label !== null;
    };
    let composer = ({register = null, label = null}) => {
        let name = register ?? label;
        let buf = Buffer.alloc(iN.size);
        buf.callback = ({offset, length, labels}) => {
            let label = labels[name];
            if (label === undefined) {
                throw new Error;
            }
            offset += length;
            let value = label - offset;
            if (!iN.is(value)) {
                throw new Error;
            }
            buf[iN.method](value);
        };
        return buf;
    };
    return [resolver, composer];
}

export function moffsClosure(posSeg) {
    let resolver = (asmArg) => {
        let {address = null} = asmArg;
        if (address === null) {
            return false;
        }
        let [seg, off] = address;
        if (!posSeg.includes(seg)) {
            return false;
        }
        let int = parseInt(off);
        if (!types.u32.is(int)) {
            return false;
        }
        asmArg.int = int;
        return true;
    };
    let composer = ({int}) => {
        let buf = Buffer.allocUnsafe(types.u32.size);
        buf[types.u32.method](int);
        return buf;
    };
    return [resolver, composer];
}

export function immClosure(uN = null, iN = null) {
    let resolver = (asmArg) => {
        let {integer = null} = asmArg;
        if (integer === null) {
            return false;
        }
        let int = parseInt(integer);
        if (uN !== null && uN.is(int)) {
            asmArg.int = int;
            asmArg.imm = uN;
            return true;
        }
        if (iN !== null && iN.is(int)) {
            asmArg.int = int;
            asmArg.imm = iN;
            return true;
        }
        return false;
    };
    let composer = ({imm, int}) => {
        let buf = Buffer.allocUnsafe(imm.size);
        buf[imm.method](int);
        return buf;
    };
    return [resolver, composer];
}

export function rawClosure(int) {
    let resolver = ({integer = null}) => {
        if (integer === null) {
            return false;
        }
        let value = parseInt(integer);
        return value === int;
    };
    return [resolver];
}

export function regClosure(reg) {
    let resolver = ({register = null}) => {
        if (register === null) {
            return false;
        }
        return register === reg;
    };
    return [reg, [resolver]];
}

export function rmClosure(reg, acceptSib = false) {
    let resolver = ({register = null, sib = null}) => {
        if (register !== null) {
            return reg.includes(register);
        }
        if (sib !== null && acceptSib) {
            if (!isSibOkay(sib)) {
                throw new Error('invalid sib');
            }
            return true;
        }
        return false;
    };
    let composer = ({register = null, sib = null}, opBuf) => {
        if (register !== null) {
            if (acceptSib) {
                opBuf.setMod('reg');
                opBuf.setRm(register);
            } else {
                opBuf.setReg(register);
            }
            return null;
        }
        // special cases:
        // 1) disp32 = ebp + disp0
        // 2) ebp + disp0 = ebp + disp8
        // 3) [esp] -> forced sib
        // 4) swap [ebp + esp] -> [esp + ebp]
        // 5) [eax * 1] -> [eax]
        let [def] = arch.scales;
        let {scale, base, index, disp} = sib;
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
            opBuf.setRm(base ?? 'ebp');
        } else {
            opBuf.useSib(true); // sib
            opBuf.setRm('esp');
            opBuf.setScale(scale ?? def);
            opBuf.setIndex(index ?? 'esp');
            opBuf.setBase(base ?? 'ebp');
        }
        opBuf.setMod(base === null ? 'disp0' : dispMode);
        return disp2buffer(disp, base === null ? 'disp32' : dispMode);
    };
    return [resolver, composer];
}

export function isSibOkay(sib) {
    let {scale, base, index, disp, minus} = sib;
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
        sib.disp = int;
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
    let idx = this.length - 2;
    val = rmRegDict[val];
    this[idx] += val << 0;
}

export function setReg(val) {
    let idx = this.length - 2;
    val = typeof val === 'string' ? rmRegDict[val] : val;
    this[idx] += val << 3;
}

export const modDict = {
    'disp0':  0b00,
    'disp8':  0b01,
    'disp32': 0b10,
    'reg':    0b11,
};

export function setMod(val) {
    let idx = this.length - 2;
    this[idx] += modDict[val] << 6;
}

export function setBase(val) {
    let idx = this.length - 1;
    val = rmRegDict[val];
    this[idx] += val << 0;
}

export function setIndex(val) {
    let idx = this.length - 1;
    val = rmRegDict[val];
    this[idx] += val << 3;
}

export function setScale(val) {
    let idx = this.length - 1;
    val = arch.scales.indexOf(val);
    this[idx] += val << 6;
}

export function useSib(setSib = undefined) {
    if (setSib !== undefined) {
        this.isSibUsed = setSib;
    }
    return this.isSibUsed;
}

export function disp2buffer(disp, mode) {
    switch (mode) {
        case 'disp0':
            return null;
        case 'disp8': {
            let buffer = Buffer.allocUnsafe(types.i8.size);
            buffer[types.i8.method](disp);
            return buffer;
        }
        case 'disp32': {
            let buffer = Buffer.allocUnsafe(types.i32.size);
            buffer[types.i32.method](disp);
            return buffer;
        }
    }
    throw new Error;
}

export function getSyscallAlias(args, instr, first = 'ebx') {
    instr = typeof instr === 'string' ? instr : 'syscall ' + instr.toString();
    let idx = register.syscall.indexOf(first);
    let sysArgs = register.syscall.slice(idx, idx + args);
    let map = (reg, i) => format('%s = $%s', reg, i);
    let alias = sysArgs.map(map).concat(instr);
    return {alias, args};
}

export function fullAlias(src, dst) {
    let obj = {};
    if (isa[dst] !== undefined) {
        obj[src] = isa[dst];
    }
    for (let opsize of arch.opsizes) {
        let srcKey = [src, opsize].join('.');
        let dstKey = [dst, opsize].join('.');
        if (isa[dstKey] !== undefined) {
            obj[srcKey] = isa[dstKey];
        }
    }
    return obj;
}
