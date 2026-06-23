import runner from './runner.js';
import bootstrap from './bootstrap.js';

const thisFile = __filename;

bootstrap({thisFile, runner});
