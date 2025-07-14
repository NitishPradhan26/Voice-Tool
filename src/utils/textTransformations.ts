/**
 * Apply word transformations to text
 * @param text - Original text
 * @param transformations - Object with incorrect->correct mappings
 * @returns Transformed text
 */
export function applyWordTransformations(
  text: string,
  transformations: Record<string, string>
): string {
  if (!Object.keys(transformations).length) return text;

  // Build a lookup for lower-case keys for case-insensitive match
  const map = Object.fromEntries(
    Object.entries(transformations).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Split on word boundaries, keeping punctuation
  return text.replace(/\b\w+\b/g, (word) => {
    const lower = word.toLowerCase();
    if (map.hasOwnProperty(lower)) {
      // Preserve original case (optional)
      return matchCase(map[lower], word);
    }
    return word;
  });
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