export const u8 = {
    min: 0x0,
    max: 0xff,
    size: 1,
    method: 'writeUInt8',
    is,
};

export const i8 = {
    min: -0x80,
    max: 0x7f,
    size: 1,
    method: 'writeInt8',
    is,
};

export const u16 = {
    min: 0x0,
    max: 0xffff,
    size: 2,
    method: 'writeUInt16LE',
    is,
};

export const i16 = {
    min: -0x8000,
    max: 0x7fff,
    size: 2,
    method: 'writeInt16LE',
    is,
};

export const u32 = {
    min: 0x0,
    max: 0xffffffff,
    size: 4,
    method: 'writeUInt32LE',
    is,
};

export const i32 = {
    min: -0x80000000,
    max: 0x7fffffff,
    size: 4,
    method: 'writeInt32LE',
    is,
};

function is(v) {
    return this.min <= v && v <= this.max;
}
