import Fuse from 'fuse.js';

export interface FuzzyMatch {
  originalWord: string;     // "recieved" 
  correctedWord: string;    // "receive"
  matchedKey: string;       // "recieve" (the key that was fuzzy matched)
  score: number;           // 0.2 (fuzzy match confidence)
  position: number;        // word position in text
}

export interface FuzzyMatchMap {
  [correctedWord: string]: FuzzyMatch;
}

export interface TransformationResult {
  transformedText: string;
  fuzzyMatches: FuzzyMatchMap;
}

/**
 * Apply word transformations to text with fuzzy matching
 * @param text - Original text
 * @param transformations - Object with incorrect->correct mappings
 * @param discardedFuzzy - Object with ignored_word->fuzzy_match mappings
 * @returns Object with transformed text and fuzzy match data
 */
export function applyWordTransformations(
  text: string,
  transformations: Record<string, string>,
  discardedFuzzy: Record<string, string> = {}
): TransformationResult {
  if (!Object.keys(transformations).length) return {
    transformedText: text,
    fuzzyMatches: {}
  };

  // Build a lookup for lower-case keys for case-insensitive match
  const map = Object.fromEntries(
    Object.entries(transformations).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Initialize Fuse.js for fuzzy matching transformation keys
  const transformationKeys = Object.keys(map);
  const fuse = new Fuse(transformationKeys, {
    includeScore: true,
    threshold: 0.2,          // Much stricter threshold for corrections
    minMatchCharLength: 2,    // Avoid very short spurious matches
    ignoreLocation: true,     // Focus on character similarity
    findAllMatches: false,    // Only get best match
  });

  const fuzzyMatches: FuzzyMatchMap = {};
  let wordPosition = 0;

  // Split on word boundaries, keeping punctuation
  const transformedText = text.replace(/\b\w+\b/g, (word) => {
    const wordLower = word.toLowerCase();
    wordPosition++;
    
    // 1. Try exact match first (current behavior)
    if (map.hasOwnProperty(wordLower)) {
      return matchCase(map[wordLower], word);
    }
    
    // 2. Try fuzzy match for variations
    if (transformationKeys.length > 0) {
      const fuzzyResults = fuse.search(wordLower);
      
      if (fuzzyResults.length > 0) {
        const bestMatch = fuzzyResults[0];
        console.log("This is the best match", bestMatch);
        // 3. Apply correction only if score is good enough AND it's not an exact match
        if (bestMatch.score !== undefined && bestMatch.score > 0) {
          // Length validation: max 20% difference in length
          const lengthDiff = Math.abs(word.length - bestMatch.item.length);
          const maxLengthDiff = Math.max(word.length, bestMatch.item.length) * 0.2; // 20% max difference
          
          if (lengthDiff > maxLengthDiff) {
            return word; // Skip if length difference is too large
          }
          
          // 4. Check if this fuzzy match was previously discarded
          if (discardedFuzzy[wordLower] === bestMatch.item) {
            return word; // Skip - user previously rejected this
          }
          
          // Apply the correction and track the fuzzy match
          const correctedWord = matchCase(map[bestMatch.item], word);
          
          // Store fuzzy match data (only for actual fuzzy matches, not exact matches)
          fuzzyMatches[correctedWord] = {
            originalWord: word,
            correctedWord: correctedWord,
            matchedKey: bestMatch.item,
            score: bestMatch.score,
            position: wordPosition
          };
          
          return correctedWord;
        }
      }
    }
    
    return word;
  });

  return {
    transformedText,
    fuzzyMatches
  };
}

/**
 * Preserves capitalization style of original word
 * @param replacement - The replacement word
 * @param original - The original word to match case from
 * @returns The replacement word with matched case
 */
function matchCase(replacement: string, original: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) 
    return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}