# Program

Program -> Sep* (Statement Sep*)*

# Mix

Sep -> Space | Newline+ | Comment
InlineSep -> Sep
NotInlineSep -> InlineSep* Sep
Space -> /^[ \t]+/
Newline -> '\r\n' | '\r' | '\n'
Comment -> SinglelineComment | MultilineComment
SinglelineComment -> '//' ^ * (Newline | Eof)
MultilineComment -> '/*' ^ * '*/'
DecNum -> '0' | /^[1-9][0-9]*/
Comma -> Sep* ',' Sep*
Eof -> /^$/
HexNum -> /^0[xX][0-9a-fA-F]+/
BinNum -> /^0[bB][0-1]+/
OctNum -> /^0[oO][0-7]+/
Num -> BinNum | OctNum | HexNum | DecNum
Int -> Sign? Num
Sign -> '+' | '-'
End -> (Sep* (Eof | '}')) | NotInlineSep
Term -> InlineSep* ';'
TermEnd -> Term | ?End

# Statement

Statement ->
    EmptyStatement
    | RegularBlock
    | AssemblerBlock
EmptyStatement -> ';'
RegularBlock -> '{'
    ^
    Sep*
    (Statement Sep*)*
'}'

# AssemblerBlock

AssemblerBlock -> `asm` Sep* '{'
    ^
    Sep*
    (AssemblerStatement Sep*)*
'}'
AssemblerStatement ->
    AssemblerEmptyStatement
    | AssemblerLabelStatement
    | AssemblerOperation
    | AssemblerInstruction
AssemblerLabelStatement -> AssemblerLabel TermEnd
AssemblerEmptyStatement -> ';'
AssemblerInstruction ->
    (AssemblerLabel InlineSep+)?
    AssemblerInstructionName
    AssemblerInstructionOperandSize?
    (InlineSep+ AssemblerArguments)?
    TermEnd
AssemblerInstructionName -> AssemblerInstructionNamePart ('.' AssemblerInstructionNamePart)*
    AssemblerInstructionNamePart -> /^[a-zA-Z][a-zA-Z0-9]*/
    AssemblerInstructionOperandSize -> '.' DecNum
AssemblerArguments -> AssemblerArgument (Comma AssemblerArgument)*
AssemblerArgument ->
    AssemblerReference
    | AssemblerAddress
    | AssemblerRegister
    | AssemblerLabelName
    | AssemblerInteger
    | AssemblerSib
AssemblerReference -> '$' DecNum
AssemblerRegister -> /^[a-z][a-z0-9]*/
AssemblerAddress -> AssemblerAddressSegment? ':' Int
AssemblerAddressSegment -> AssemblerRegister | Num
AssemblerInteger -> Int
AssemblerSib -> '['
    ^
    Sep*
    AssemblerSibOperand
    (
        Sep*
        AssemblerSibOperation
        Sep*
        AssemblerSibOperand
    )*
    Sep*
']'
AssemblerSibOperation -> '+' | '-' | '*'
AssemblerSibOperand -> AssemblerRegister | Int
AssemblerOperation ->
    (AssemblerLabel InlineSep+)?
    AssemblerArgument
    Sep* AssemblerOperationName Sep*
    ^
    AssemblerArguments
    TermEnd
AssemblerOperationName -> '=' | '++' | '--' | '!='
AssemblerLabel -> AssemblerLabelName ':'
AssemblerLabelName -> /^[_a-zA-Z][_a-zA-Z0-9]*/
