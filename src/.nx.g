# Program

Program -> Sep* (Statement Sep*)*

# Mix

Sep -> Space | Newline+ | Comment
Space -> /^[ \t]+/
Newline -> '\r\n' | '\r' | '\n'
Comment -> SinglelineComment | MultilineComment
SinglelineComment -> '//' ^ * (Newline | Eof)
MultilineComment -> '/*' ^ * '*/'
Eof -> /^$/
DecNum -> '0' | /^[1-9][0-9]*/
Comma -> Sep* ',' Sep*
End -> (Sep* (Eof | '}')) | (Sep<isInline>* Sep<!isInline>+)
Term -> Sep<isInline>* ';'
TermEnd -> Term | ?End
HexNum -> /^0[xX][0-9a-fA-F]+/
Num -> HexNum | DecNum
Int -> Sign? Num
Sign -> '+' | '-'

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
    | AssemblerAddress
    | AssemblerRegister
    | AssemblerInteger
    | AssemblerSib
AssemblerReference -> '$' DecNum
AssemblerRegister -> /^[a-z][a-z0-9]*/
AssemblerAddress -> AssemblerAddressSegment? ':' AssemblerAddressOffset
AssemblerAddressSegment -> AssemblerRegister | Num
AssemblerAddressOffset -> Int
AssemblerInteger -> Int
AssemblerSib -> '['
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
AssemblerSibOperand -> AssemblerRegister | Num

# AssemblerLabel -> AssemblerLabelName ':'
# AssemblerLabelName -> /^[_a-zA-Z][_a-zA-Z0-9]*/
