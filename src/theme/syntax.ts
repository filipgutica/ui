export const syntaxTokenNames = [
  'comment', 'keyword', 'string', 'number', 'function', 'type',
  'variable', 'operator', 'punctuation', 'tag', 'attribute',
] as const

export type SyntaxToken = typeof syntaxTokenNames[number]
export type SyntaxPalette = Partial<Record<SyntaxToken, string>>

const scopeFamilies: Record<SyntaxToken, readonly string[]> = {
  comment: ['comment'],
  keyword: ['keyword', 'storage'],
  string: ['string'],
  number: ['constant.numeric', 'constant.language'],
  function: ['entity.name.function', 'support.function'],
  type: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
  variable: ['variable'],
  operator: ['keyword.operator'],
  punctuation: ['punctuation'],
  tag: ['entity.name.tag'],
  attribute: ['entity.other.attribute-name'],
}

/** The importer reduces provider scope names to our portable syntax palette. */
export const syntaxRolesForScope = (scope: string): SyntaxToken[] => {
  const matches = syntaxTokenNames.map(role => ({
    role,
    specificity: Math.max(0, ...scopeFamilies[role].filter(prefix =>
      scope === prefix || scope.startsWith(`${prefix}.`)).map(prefix => prefix.length)),
  }))
  const specificity = Math.max(...matches.map(match => match.specificity))
  return matches.filter(match => match.specificity > 0 && match.specificity === specificity).map(match => match.role)
}
