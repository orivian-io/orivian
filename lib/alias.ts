// Public aliases. Same word lists and rules as generate_alias() /
// enforce_profile_alias() in 0014_live_activity_and_aliases.sql.

const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Bold', 'Quiet', 'Steady', 'Clever', 'Keen', 'Brave', 'Lucky',
  'Noble', 'Rapid', 'Silent', 'Sunny', 'Wise', 'Amber', 'Golden', 'Silver', 'Northern', 'Eastern',
  'Western', 'Southern', 'Hidden', 'Daring', 'Gentle', 'Vivid', 'Cosmic', 'Crisp', 'Mighty', 'Nimble',
]
const NOUNS = [
  'Falcon', 'Otter', 'Summit', 'Harbor', 'Comet', 'Maple', 'Cedar', 'River', 'Lynx', 'Heron',
  'Fox', 'Raven', 'Willow', 'Pine', 'Ridge', 'Beacon', 'Compass', 'Canyon', 'Meadow', 'Orbit',
  'Sparrow', 'Glacier', 'Badger', 'Aspen', 'Thunder', 'Kestrel', 'Owl', 'Tide', 'Quartz', 'Ember',
]

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]

export function generateAlias() {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${10 + Math.floor(Math.random() * 990)}`
}

const ALIAS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}[A-Za-z0-9]$/

// Returns an error message, or null if the alias is acceptable.
export function validateAlias(raw: string): string | null {
  const alias = raw.trim()
  if (!alias) return 'An alias is required.'
  if (alias.length < 3 || alias.length > 24) return 'Aliases must be 3-24 characters.'
  if (!ALIAS_PATTERN.test(alias)) return 'Use letters, numbers, spaces, dots, dashes or underscores (start and end with a letter or number).'
  return null
}

// Turns a database error from saving an alias into a friendly message.
export function aliasSaveError(error: { code?: string; message?: string } | null): string {
  if (!error) return ''
  if (error.code === '23505') return 'That alias is already taken - try another, or shuffle.'
  if (error.message && /alias/i.test(error.message)) return error.message
  return "Couldn't save your alias. Please try again."
}
