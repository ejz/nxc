import Token from './Token.js';

export default class GrammarToken extends Token {
}

export class GroupToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Group');
    }
}

export class SequenceToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Sequence');
    }
}

export class ChoiceToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Choice');
    }
}

export class LookupToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Lookup');
    }
}

export class OptionalToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Optional');
    }
}

export class RepeatToken extends GrammarToken {
    constructor(lexer) {
        super(lexer, 'Repeat');
    }
}
