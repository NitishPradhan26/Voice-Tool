import OpenAI from 'openai';

/**
 * Initialize and return OpenAI client with API key validation
 * @returns OpenAI client instance
 * @throws Error if API key is not configured
 */
export function getOpenAIClient(): OpenAI {
  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai;
}