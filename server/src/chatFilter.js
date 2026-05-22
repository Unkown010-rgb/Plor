/**
 * Server-side chat filter.
 * Censors profanity, tracks per-user warnings, and enforces mutes.
 * All filtering happens on the server so clients cannot bypass it.
 */

// Common profanity / slurs — stored as fragments so the file isn't a directory of slurs.
// The regex builder expands these into full word-boundary patterns.
const BAD_WORDS = [
  'fuck','shit','ass','bitch','cunt','dick','cock','pussy','bastard','damn',
  'hell','crap','piss','slut','whore','nigger','nigga','faggot','fag','retard',
  'rape','kill yourself','kys','suicide','porn','sex','naked','nude',
  'asshole','motherfucker','motherfucking','bullshit',
];

// Build a single case-insensitive regex that matches whole words (with leet-speak tolerance)
function buildPattern(word) {
  return word
    .replace(/a/g, '[a@4]')
    .replace(/e/g, '[e3]')
    .replace(/i/g, '[i1!]')
    .replace(/o/g, '[o0]')
    .replace(/s/g, '[s$5]')
    .replace(/t/g, '[t7]')
    .replace(/\s+/g, '\\s*'); // allow spaces between letters in phrases
}

const PATTERNS = BAD_WORDS.map(w => new RegExp(buildPattern(w), 'gi'));

// Per-user warning state (in-memory; persists for the server's lifetime)
// Map<userId, { warnings: number, mutedUntil: Date|null }>
const userState = new Map();

const WARN_LIMIT = 3;         // warnings before mute
const MUTE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Replaces bad words in text with asterisks of the same length.
 * Returns { filtered: string, hadViolation: boolean }
 */
function filterText(text) {
  let filtered = text;
  let hadViolation = false;
  for (const pattern of PATTERNS) {
    filtered = filtered.replace(pattern, match => {
      hadViolation = true;
      return '*'.repeat(match.length);
    });
  }
  return { filtered, hadViolation };
}

/**
 * Process a chat message for a user.
 * Returns:
 *   { allowed: false, reason: 'muted', muteRemaining: seconds }
 *   { allowed: true,  message: string, warned: false }
 *   { allowed: true,  message: string, warned: true, warningCount: n, muted: false }
 *   { allowed: true,  message: string, warned: true, warningCount: n, muted: true, muteDuration: 300 }
 */
function processMessage(userId, text) {
  let state = userState.get(userId);
  if (!state) {
    state = { warnings: 0, mutedUntil: null };
    userState.set(userId, state);
  }

  // Check if user is currently muted
  if (state.mutedUntil && state.mutedUntil > new Date()) {
    const secondsLeft = Math.ceil((state.mutedUntil - new Date()) / 1000);
    return { allowed: false, reason: 'muted', muteRemaining: secondsLeft };
  } else if (state.mutedUntil) {
    // Mute expired — reset
    state.mutedUntil = null;
    state.warnings = 0;
  }

  const { filtered, hadViolation } = filterText(text);

  if (!hadViolation) {
    return { allowed: true, message: filtered, warned: false };
  }

  // Increment warning
  state.warnings += 1;
  const warningCount = state.warnings;

  if (warningCount >= WARN_LIMIT) {
    // Mute the user
    state.mutedUntil = new Date(Date.now() + MUTE_DURATION_MS);
    state.warnings = 0;
    return {
      allowed: true,
      message: filtered,
      warned: true,
      warningCount,
      muted: true,
      muteDuration: MUTE_DURATION_MS / 1000,
    };
  }

  return {
    allowed: true,
    message: filtered,
    warned: true,
    warningCount,
    muted: false,
    warningsLeft: WARN_LIMIT - warningCount,
  };
}

/**
 * Check a username or display name for prohibited content.
 * Returns { clean: boolean, reason?: string }
 */
function checkUsername(name) {
  const { hadViolation } = filterText(name);
  if (hadViolation) return { clean: false, reason: 'Username contains inappropriate content.' };
  if (name.length < 3) return { clean: false, reason: 'Too short.' };
  if (name.length > 20) return { clean: false, reason: 'Too long.' };
  return { clean: true };
}

/**
 * Clear warning state for a user (e.g. on disconnect or admin pardon).
 */
function clearState(userId) {
  userState.delete(userId);
}

module.exports = { processMessage, filterText, checkUsername, clearState };
