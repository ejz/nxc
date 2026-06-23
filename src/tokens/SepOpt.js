import Sep from './Sep.js';

export default class SepOpt extends Sep {
    isEmpty() {
        return this.children.length === 0;
    }
}
