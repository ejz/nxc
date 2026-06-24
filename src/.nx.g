# Program

Program -> SepOpt (Statement SepOpt)*
Statement ->
    EmptyStatement
    | RegularBlock
    | AssemblerBlock
EmptyStatement -> ';'
RegularBlock -> '{' ^ SepOpt (Statement SepOpt)* '}'
SepOpt -> (Whitespace | Comment)*
Sep -> (Whitespace | Comment)+
SameLineSep -> !
Comment -> SinglelineComment | MultilineComment
Whitespace -> ' ' | '\t' | Newline
Newline -> '\r\n' | '\r' | '\n'
SinglelineComment -> '//' SinglelineCommentBody
MultilineComment -> '/*' MultilineCommentBody ^ '*/'
SinglelineCommentBody -> !
MultilineCommentBody -> !

# AssemblerBlock

AssemblerBlock -> `asm` SepOpt '{' ^ SepOpt (AssemblerStatement SepOpt)* '}'
AssemblerStatement ->
    AssemblerStandaloneLabel
    | AssemblerEmptyStatement
    | AssemblerOperation
    | AssemblerInstruction
AssemblerStandaloneLabel -> AssemblerLabel End
AssemblerInlineLabel -> AssemblerLabel SameLineSep
AssemblerLabel -> AssemblerLabelName ':'
AssemblerLabelName -> /^[_a-zA-Z][_a-zA-Z0-9]*/

# AssemblerEmptyStatement

AssemblerEmptyStatement -> AssemblerInlineLabel? AssemblerEmptyStatementBody
AssemblerEmptyStatementBody -> ';'

# AssemblerOperation

AssemblerOperation -> AssemblerInlineLabel? AssemblerOperationBody
AssemblerOperationBody ->
    AssemblerArgument
    SepOpt AssemblerOperand SepOpt
    ^
    AssemblerArguments
    TermEnd
AssemblerOperand -> !
AssemblerArgument ->
    AssemblerReference
    | AssemblerAddress
    | AssemblerInteger
    | AssemblerScaleIndexBase
    | AssemblerRegister
    | AssemblerLabelName
AssemblerReference -> '$' DecNum
AssemblerAddress -> AssemblerAddressSegment? ':' AssemblerAddressOffset
AssemblerAddressSegment -> AssemblerRegister | Num
AssemblerAddressOffset -> Num
AssemblerInteger -> Int
AssemblerRegister -> /^[a-z][a-z0-9]*/
AssemblerArguments -> AssemblerArgument (Comma AssemblerArgument)*

# AssemblerScaleIndexBase

AssemblerScaleIndexBase -> '[' SepOpt AssemblerScaleIndexBaseBody SepOpt ']'
AssemblerScaleIndexBaseBody -> (
    (SepOpt AssemblerScaleIndexBaseBodyOperand SepOpt)?
    AssemblerScaleIndexBaseBodyPart
)+
AssemblerScaleIndexBaseBodyOperand -> '+' | '-' | '*'
AssemblerScaleIndexBaseBodyPart -> AssemblerRegister | Num

# AssemblerInstruction

AssemblerInstruction -> AssemblerInlineLabel? AssemblerInstructionBody
AssemblerInstructionBody ->
    AssemblerInstructionName
    AssemblerInstructionOperandSize?
    AssemblerInstructionArguments?
    TermEnd
AssemblerInstructionName -> AssemblerInstructionNamePart ('.' AssemblerInstructionNamePart)*
AssemblerInstructionNamePart -> /^[a-zA-Z][a-zA-Z0-9]*/
AssemblerInstructionOperandSize -> '.' DecNum
AssemblerInstructionArguments -> SameLineSep AssemblerArguments

# Generic

End -> !
TermEnd -> Term | End
Term -> SameLineSep? ';'
Comma -> SepOpt ',' SepOpt
DecNum -> /^(0|[1-9][0-9]*)/
HexNum -> /^0x[0-9a-fA-F]+/
Num -> HexNum | DecNum
Int -> Sign? Num
Sign -> '+' | '-'
