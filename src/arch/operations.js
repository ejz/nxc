import x86 from './x86.js';

export default Array.from(new Set([].concat(
	x86.operations,
)));
