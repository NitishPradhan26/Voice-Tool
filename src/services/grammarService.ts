import { getOpenAIClient } from '@/lib/openAI';
import { getUserTransformations } from '@/services/promptService';
import { applyWordTransformations } from '@/utils/textTransformations';

interface GrammarCorrectionResult {
  correctedText: string;
  duration: number;
}

/**
 * Correct grammar and spelling in text using OpenAI, then apply user transformations
 * @param text - Text to correct
 * @param userPrompt - Optional custom prompt for grammar correction
 * @param uid - User ID for applying personal word transformations
 * @returns Promise<GrammarCorrectionResult> - Corrected text and duration
 */
export async function correctGrammar(
  text: string, 
  userPrompt?: string,
  uid?: string
): Promise<GrammarCorrectionResult> {
  const startTime = Date.now();
  
  // Initialize OpenAI client
  const openai = getOpenAIClient();
  
  // Default grammar correction prompt
  const defaultPrompt = `Fix grammar and spelling in the following text. Keep the original meaning and tone. Return only the corrected text without explanations or additional commentary.`;
  
  // Set up timeout for grammar correction
  const GRAMMAR_TIMEOUT = 30000; // 30 seconds timeout
  const controller = new AbortController();
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Grammar correction timed out after ${GRAMMAR_TIMEOUT / 1000} seconds`));
    }, GRAMMAR_TIMEOUT);
  });
  
  console.log(`Starting grammar correction for text: "${text.substring(0, 100)}..."`);
  
  try {
    // Create grammar correction request with JSON response format
    const correctionPromise = openai.chat.completions.create({
      model: 'gpt-4-1106-preview', // Better for structured JSON responses
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Fix grammar and spelling in the provided text AND NOTHING ELSE. Return ONLY the corrected text in JSON format: {"corrected": "..."}'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1, // Low temperature for consistent corrections
      max_tokens: Math.max(text.length * 2, 1000), // Ensure enough tokens for response
    }, {
      signal: controller.signal // Pass abort signal
    });
    
    // Race between correction and timeout
    const response = await Promise.race([
      correctionPromise,
      timeoutPromise
    ]);
    
    // Parse JSON response to get only the corrected text
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }
    
    const json = JSON.parse(responseContent);
    let finalText = json.corrected || text;
    
    // Apply user transformations after grammar correction
    if (uid) {
      try {
        console.log('Getting user transformations for user:', uid);
        const userTransformations = await getUserTransformations(uid);
        if (Object.keys(userTransformations).length > 0) {
          finalText = applyWordTransformations(finalText, userTransformations);
          console.log('Applied user transformations to grammar-corrected text');
        }
      } catch (transformError) {
        console.warn('Transformation failed:', transformError);
        // Continue with grammar-corrected text
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`Grammar correction completed in ${duration}ms`);
    console.log(`Original: "${text}"`);
    console.log(`Final: "${finalText}"`);
    
    return {
      correctedText: finalText,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Grammar correction error:', error);
    
    // If correction fails, return original text
    return {
      correctedText: text,
      duration
    };
  }
}