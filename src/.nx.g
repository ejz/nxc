# Program

Program -> Sep* (Statement Sep*)*

# Sep

Sep -> Whitespace | Comment
Whitespace -> /^[ \t\r\n]+/
Comment -> SinglelineComment | MultilineComment
SinglelineComment -> '//' SinglelineCommentBody
SinglelineCommentBody -> !
MultilineComment -> '/*' MultilineCommentBody ^ '*/'
MultilineCommentBody -> !

# Statement

Statement ->
    EmptyStatement
    | RegularBlock
EmptyStatement -> ';'
RegularBlock -> '{' ^ Sep* (Statement Sep*)* '}'

# | AssemblerBlock
# AssemblerBlock

# AssemblerBlock -> `asm` Sep* '{' ^ Sep* (AssemblerStatement Sep*)* '}'
# AssemblerStatement ->
#     AssemblerStandaloneLabel
#     | AssemblerEmptyStatement
#     | AssemblerOperation
#     | AssemblerInstruction
# AssemblerStandaloneLabel -> AssemblerLabel End
# AssemblerLabel -> AssemblerLabelName ':'
# AssemblerLabelName -> /^[_a-zA-Z][_a-zA-Z0-9]*/
# AssemblerEmptyStatement -> AssemblerInlineLabel? AssemblerEmptyStatementBody
# AssemblerEmptyStatementBody -> ';'
# AssemblerInlineLabel -> AssemblerLabel InlineSep+
# 
# # AssemblerOperation
# 
# AssemblerOperation -> AssemblerInlineLabel? AssemblerOperationBody
# AssemblerOperationBody ->
#     AssemblerArgument
#     Sep* AssemblerOperand Sep*
#     ^
#     AssemblerArguments
#     TermEnd
# AssemblerOperand -> !
# AssemblerArgument ->
#     AssemblerReference
#     | AssemblerAddress
#     | AssemblerInteger
#     | AssemblerScaleIndexBase
#     | AssemblerRegister
#     | AssemblerLabelName
# AssemblerReference -> '$' DecNum
# AssemblerAddress -> AssemblerAddressSegment? ':' AssemblerAddressOffset
# AssemblerAddressSegment -> AssemblerRegister | Num
# AssemblerAddressOffset -> Num
# AssemblerInteger -> Int
# AssemblerRegister -> /^[a-z][a-z0-9]*/
# AssemblerArguments -> AssemblerArgument (Comma AssemblerArgument)*
# AssemblerScaleIndexBase -> '['
#     Sep*
#     AssemblerScaleIndexBaseOperand
#     (
#         Sep*
#         AssemblerScaleIndexBaseOperation
#         Sep*
#         AssemblerScaleIndexBaseOperand
#     )*
#     Sep*
# ']'
# AssemblerScaleIndexBaseOperation -> '+' | '-' | '*'
# AssemblerScaleIndexBaseOperand -> AssemblerRegister | Num
# 
# # AssemblerInstruction
# 
# AssemblerInstruction -> AssemblerInlineLabel? AssemblerInstructionBody
# AssemblerInstructionBody ->
#     AssemblerInstructionName
#     AssemblerInstructionOperandSize?
#     AssemblerInstructionArguments?
#     TermEnd
# AssemblerInstructionName -> AssemblerInstructionNamePart ('.' AssemblerInstructionNamePart)*
# AssemblerInstructionNamePart -> /^[a-zA-Z][a-zA-Z0-9]*/
# AssemblerInstructionOperandSize -> '.' DecNum
# AssemblerInstructionArguments -> InlineSep+ AssemblerArguments

# Generic

# End -> !
# InlineSep -> !
# TermEnd -> Term | End
# Term -> InlineSep* ';'
# Comma -> Sep* ',' Sep*
# DecNum -> '0' | /^[1-9][0-9]*/
# HexNum -> /^0x[0-9a-fA-F]+/
# Num -> HexNum | DecNum
# Int -> Sign? Num
# Sign -> '+' | '-'
