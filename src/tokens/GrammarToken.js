import Token from './Token.js';

export default class GrammarToken extends Token {
}

export class GroupToken extends GrammarToken {
    constructor(...args) {
        super('Group', ...args);
    }
}

export class SequenceToken extends GrammarToken {
    constructor(...args) {
        super('Sequence', ...args);
    }
}

export class ChoiceToken extends GrammarToken {
    constructor(...args) {
        super('Choice', ...args);
    }
}

export class LookupToken extends GrammarToken {
    constructor(...args) {
        super('Lookup', ...args);
    }
}

export class OptionalToken extends GrammarToken {
    constructor(...args) {
        super('Optional', ...args);
    }
}

export class RepeatToken extends GrammarToken {
    constructor(...args) {
        super('Repeat', ...args);
    }
}
