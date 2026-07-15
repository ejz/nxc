import Token from './Token.js';

export default class AssemblerBlock extends Token {
    toBuffer(arch) {
        // let labels = Object.create(null);
        let chunks = [];
        // let offset = 0;
        let callbacks = [];
        for (let statement of this.filter('AssemblerStatement')) {
            
            console.log(statement);
            // if (statement.label !== null) {
            //     let name = statement.label.name;
            //     if (labels[name] !== undefined) {
            //         throw statement.label.error();
            //     }
            //     labels[name] = offset;
            // }
            // let buffers;
            // try {
            //     buffers = statement.toBuffer(arch);
            // } catch (e) {
            //     if (e instanceof LexerError) {
            //         throw e;
            //     }
            //     if (!(e instanceof AppError)) {
            //         throw e;
            //     }
            //     throw statement.error(e);
            // }
            // buffers.forEach((chunk) => {
            //     let length = chunk.length;
            //     if (chunk.callback !== undefined) {
            //         let chunkOffset = offset;
            //         callbacks.push(() => chunk.callback({
            //             offset: chunkOffset,
            //             length,
            //             labels,
            //         }));
            //     }
            //     chunks.push(chunk);
            //     offset += length;
            // });
        }
        callbacks.forEach((callback) => {
            callback();
        });
        return Buffer.concat(chunks);
    }
}
