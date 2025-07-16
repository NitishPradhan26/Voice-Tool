import { getOpenAIClient } from '@/lib/openAI';
import { applyWordTransformations, FuzzyMatchMap } from '@/utils/textTransformations';

interface GrammarCorrectionResult {
  correctedText: string;
  duration: number;
  fuzzyMatches: FuzzyMatchMap;
}

/**
 * Get grammar correction from OpenAI
 * @param text - Text to correct
 * @param prompt - Grammar correction prompt
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise<{ correctedText: string; duration: number }>
 */
export async function getGrammarCorrection(
  text: string,
  prompt: string,
  timeoutMs = 30000
): Promise<{ correctedText: string; duration: number }> {
  const startTime = Date.now();
  const openai = getOpenAIClient();
  const controller = new AbortController();
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Grammar correction timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });

  try {
    const correctionPromise = openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: prompt + ' Return ONLY the corrected text in JSON format: {"corrected": "..."}',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.0,
      max_tokens: Math.max(text.length * 2, 1000),
    }, { signal: controller.signal });

    const response = await Promise.race([correctionPromise, timeoutPromise]);
    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response content from OpenAI');
    const json = JSON.parse(content);
    return {
      correctedText: json.corrected || text,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return { correctedText: text, duration: Date.now() - startTime };
  }
}

/**
 * Apply user transformations to text
 * @param text - Text to transform
 * @param userTransformations - User's word correction dictionary
 * @param discardedFuzzy - User's discarded fuzzy matches to avoid
 * @returns { transformedText: string; fuzzyMatches: FuzzyMatchMap }
 */
export function applyUserTransformations(
  text: string,
  userTransformations: Record<string, string>,
  discardedFuzzy: Record<string, string>
): { transformedText: string; fuzzyMatches: FuzzyMatchMap } {
  try {
    if (Object.keys(userTransformations).length > 0) {
      return applyWordTransformations(text, userTransformations, discardedFuzzy);
    }
    return { transformedText: text, fuzzyMatches: {} };
  } catch (error) {
    console.warn('Transformation failed:', error);
    return { transformedText: text, fuzzyMatches: {} };
  }
}

/**
 * Process text with grammar correction and user transformations
 * @param text - Text to process
 * @param userPrompt - Optional custom prompt for grammar correction
 * @param userTransformations - User's word correction dictionary
 * @param discardedFuzzy - User's discarded fuzzy matches to avoid
 * @returns Promise<GrammarCorrectionResult>
 */
export async function processTextWithGrammarAndUserTransforms(
  text: string, 
  userPrompt?: string,
  userTransformations: Record<string, string> = {},
  discardedFuzzy: Record<string, string> = {}
): Promise<GrammarCorrectionResult> {
  const startTime = Date.now();
  
  console.log(`Starting grammar correction for text: "${text.substring(0, 100)}..."`);
  console.log('userPrompt', userPrompt);
  
  try {
    // Get grammar correction
    const { correctedText: grammarCorrectedText } = await getGrammarCorrection(
      text, 
      userPrompt || 'Correct the grammar and spelling in the following text.'
    );
    
    // Apply user transformations after grammar correction
    const { transformedText: finalText, fuzzyMatches } = applyUserTransformations(
      grammarCorrectedText, 
      userTransformations, 
      discardedFuzzy
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`Grammar correction completed in ${duration}ms`);
    console.log(`Original: "${text}"`);
    console.log(`Final: "${finalText}"`);
    
    return {
      correctedText: finalText,
      duration,
      fuzzyMatches
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Grammar correction error:', error);
    
    // If correction fails, return original text
    return {
      correctedText: text,
      duration,
      fuzzyMatches: {}
    };
  }
}

