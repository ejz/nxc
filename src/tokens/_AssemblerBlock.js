import Token from './Token.js';

export default class AssemblerBlock extends Token {
    toBuffer(arch) {
        let labels = Object.create(null);
        let offset = 0;
        let chunks = [];
        let callbacks = [];
        for (let statement of this.filter('AssemblerStatement')) {
            let child = statement.getChild();
            if (child.is('AssemblerLabelStatement')) {
                let [label] = child.filter('AssemblerLabelName');
                let name = label.toString();
                if (labels[name] !== undefined) {
                    throw new Error;
                }
                labels[name] = offset;
                continue;
            }
            let [asmLabel = null] = child.filter('AssemblerLabel');
            if (asmLabel !== null && asmLabel.parent.is('AssemblerInstruction', 'AssemblerOperation')) {
                let [label] = child.filter('AssemblerLabelName');
                let name = label.toString();
                if (labels[name] !== undefined) {
                    throw new Error;
                }
                labels[name] = offset;
            }
            let buffers = statement.toBuffer(arch);
            buffers.forEach((chunk) => {
                let length = chunk.length;
                if (chunk.callback !== undefined) {
                    let chunkOffset = offset;
                    callbacks.push(() => {
                        chunk.callback(labels, length, chunkOffset);
                    });
                }
                chunks.push(chunk);
                offset += length;
            });
        }
        callbacks.forEach((callback) => {
            callback();
        });
        return Buffer.concat(chunks);
    }
}
