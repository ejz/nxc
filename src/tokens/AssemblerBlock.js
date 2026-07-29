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
                // continue;
                // console.log({asmLabel});
            }
            // let [token] = statement.children;
            let buffers = statement.toBuffer(arch);
            // console.log({token});
            // if ()
            // if (statement.label !== null) {
            //     let name = statement.label.name;
            
            // }
            // try {
            //     buffers = ;
            // } catch (e) {
            //     if (e instanceof LexerError) {
            //         throw e;
            //     }
            //     if (!(e instanceof AppError)) {
            //         throw e;
            //     }
            //     throw statement.error(e);
            // }
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
