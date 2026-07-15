# Program

Program -> Sep* (Statement Sep*)*

# Mix

Sep -> Space | Newline* | Comment
Space -> /^[ \t]+/
Newline -> /^[\r\n]/
Comment -> SinglelineComment | MultilineComment
SinglelineComment -> '//' ^ .* (Newline | Eof)
MultilineComment -> '/*' ^ .* '*/'
Eof -> /^$/
DecNum -> '0' | /^[1-9][0-9]*/
Comma -> Sep* ',' Sep*
End -> (Sep* (Eof | '}')) | (Sep<isInline>* Sep<!isInline>+ Sep<isInline>*)
Term -> Sep<isInline>* ';'
TermEnd -> Term | ?End

# Statement

Statement ->
    EmptyStatement
    | RegularBlock
    | AssemblerBlock
EmptyStatement -> ';'
RegularBlock -> '{' ^ Sep* (Statement Sep*)* '}'

# AssemblerBlock

AssemblerBlock -> `asm` Sep* '{' ^ Sep* (AssemblerStatement Sep*)* '}'
AssemblerStatement ->
    AssemblerEmptyStatement
    | AssemblerInstruction
AssemblerEmptyStatement -> ';'
AssemblerInstruction ->
    AssemblerInstructionName
    AssemblerInstructionOperandSize?
    (Sep<isInline>+ AssemblerArguments)?
AssemblerInstructionName -> AssemblerInstructionNamePart ('.' AssemblerInstructionNamePart)*
    AssemblerInstructionNamePart -> /^[a-zA-Z][a-zA-Z0-9]*/
    AssemblerInstructionOperandSize -> '.' DecNum
AssemblerArguments -> AssemblerArgument (Comma AssemblerArgument)*
AssemblerArgument ->
    AssemblerReference
    | AssemblerRegister
AssemblerReference -> '$' DecNum
AssemblerRegister -> /^[a-z][a-z0-9]*/

#    | AssemblerAddress
#    | AssemblerInteger
#    | AssemblerScaleIndexBase
#    | AssemblerLabelName
# AssemblerInstructionArguments -> InlineSep+ AssemblerArguments
# | AssemblerOperation
# AssemblerOperation ->
#     AssemblerArgument
#     Sep* AssemblerOperand Sep*
#     ^
#     AssemblerArguments
# AssemblerOperand -> !
# AssemblerStandaloneLabel -> AssemblerLabel
# AssemblerInlineLabel -> AssemblerLabel InlineSep+
# AssemblerLabel -> AssemblerLabelName ':'
# AssemblerLabelName -> /^[_a-zA-Z][_a-zA-Z0-9]*/
# AssemblerAddress -> AssemblerAddressSegment? ':' AssemblerAddressOffset
# AssemblerAddressSegment -> AssemblerRegister | Num
# AssemblerAddressOffset -> Num
# AssemblerInteger -> Int
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
# Generic
# InlineSep -> !
# HexNum -> /^0x[0-9a-fA-F]+/
# Num -> HexNum | DecNum
# Int -> Sign? Num
# Sign -> '+' | '-'
