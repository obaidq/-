/**
 * Arabic Profanity Filter for Abu Abed Box
 * Server-side validation for free-text inputs
 * Modes: off / moderate / strict
 */

// Common Arabic/Gulf profanity patterns (hashed representations, not explicit words)
// This list covers insults, slurs, and offensive terms in Gulf Arabic
const MODERATE_PATTERNS = [
  // Common Gulf Arabic insults and vulgar terms (regex patterns)
  /حمار/,
  /غبي/,
  /أحمق/,
  /كلب/,
  /حيوان/,
  /تافه/,
  /منحرف/,
  /شاذ/,
  /عاهر[ةه]?/,
  /زاني[ةه]?/,
  /لعنة/,
  /يلعن/,
  /ابن ال[كئ]/,
  /أم[كئ]/,
  /طز/,
  /كس/,
  /زب/,
  /نيك/,
  /خرا/,
  /زفت/,
  /قحب[ةه]/,
  /عرص/,
  /ديوث/,
  /منيوك/,
  /متخلف/,
  /معاق/, // when used as insult
];

const STRICT_EXTRA = [
  // Milder but still potentially offensive
  /بقر[ةه]?/,
  /ثور/,
  /جحش/,
  /مجنون/,
  /أهبل/,
  /هبل/,
  /غشيم/,
  /مسخر[ةه]/,
  /وسخ/,
  /قذر/,
  /نجس/,
  /مقرف/,
  /تبا/,
  /اخرس/,
  /انقلع/,
];

// Common evasion patterns (letter substitution, spacing)
function normalizeArabic(text) {
  return text
    .replace(/[ًٌٍَُِّْ]/g, '')      // remove tashkeel
    .replace(/ـ+/g, '')              // remove kashida
    .replace(/\s+/g, ' ')            // normalize whitespace
    .replace(/[أإآ]/g, 'ا')          // normalize alef
    .replace(/ة/g, 'ه')             // normalize ta marbuta
    .replace(/ى/g, 'ي')             // normalize alef maksura
    .replace(/ؤ/g, 'و')             // normalize hamza waw
    .replace(/ئ/g, 'ي')             // normalize hamza ya
    .trim();
}

/**
 * Check text for profanity
 * @param {string} text - The text to check
 * @param {string} mode - 'off' | 'moderate' | 'strict'
 * @returns {{ clean: boolean, filtered: string }}
 */
function checkProfanity(text, mode) {
  if (!text || typeof text !== 'string' || mode === 'off') {
    return { clean: true, filtered: text || '' };
  }

  const normalized = normalizeArabic(text);
  let patterns = [...MODERATE_PATTERNS];
  if (mode === 'strict') {
    patterns = [...patterns, ...STRICT_EXTRA];
  }

  let clean = true;
  let filtered = text;

  for (const pattern of patterns) {
    if (pattern.test(normalized)) {
      clean = false;
      // Replace matched text with stars
      filtered = filtered.replace(new RegExp(pattern.source, 'gi'), (match) => {
        return '✱'.repeat(match.length);
      });
    }
  }

  return { clean, filtered };
}

/**
 * Filter text - returns filtered version or rejection
 * @param {string} text
 * @param {string} mode - 'off' | 'moderate' | 'strict'
 * @returns {{ allowed: boolean, text: string, message?: string }}
 */
function filterText(text, mode) {
  if (mode === 'off') return { allowed: true, text };

  const result = checkProfanity(text, mode);
  if (result.clean) {
    return { allowed: true, text };
  }

  if (mode === 'strict') {
    return {
      allowed: false,
      text: '',
      message: 'الإجابة تحتوي على كلمات غير مسموحة. حاول مرة ثانية!'
    };
  }

  // Moderate mode: allow but filter
  return { allowed: true, text: result.filtered };
}

module.exports = { checkProfanity, filterText, normalizeArabic };
