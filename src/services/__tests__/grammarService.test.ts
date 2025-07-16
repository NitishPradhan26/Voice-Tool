import { 
  getGrammarCorrection, 
  applyUserTransformations, 
  processTextWithGrammarAndUserTransforms 
} from '../grammarService';
import { getOpenAIClient } from '../../lib/openAI';
import { applyWordTransformations } from '../../utils/textTransformations';

// Mock OpenAI client
const mockCreate = jest.fn();
const mockGetOpenAIClient = jest.mocked(getOpenAIClient);

// Mock text transformations utility
jest.mock('../../utils/textTransformations', () => ({
  applyWordTransformations: jest.fn()
}));

jest.mock('../../lib/openAI', () => ({
  getOpenAIClient: jest.fn()
}));

describe('grammarService', () => {
  const originalEnv = process.env;
  const mockApplyWordTransformations = jest.mocked(applyWordTransformations);

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Setup default mock for getOpenAIClient
    mockGetOpenAIClient.mockReturnValue({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('getGrammarCorrection', () => {
    describe('Unit & Integration Tests', () => {
      it('should return grammar-corrected text from OpenAI response', async () => {
        const inputText = 'i have a spellin error';
        const expectedCorrectedText = 'I have a spelling error';
        const prompt = 'Correct the grammar and spelling.';

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: expectedCorrectedText })
              }
            }]
          }), 10))
        );

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(expectedCorrectedText);
        expect(result.duration).toBeGreaterThan(0);
        expect(mockCreate).toHaveBeenCalledWith({
          model: 'gpt-4-1106-preview',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: prompt + ' Return ONLY the corrected text in JSON format: {"corrected": "..."}'
            },
            {
              role: 'user',
              content: inputText
            }
          ],
          temperature: 0.0,
          max_tokens: Math.max(inputText.length * 2, 1000)
        }, { signal: expect.any(AbortSignal) });
      });

      it('should return original text if OpenAI returns no content', async () => {
        const inputText = 'original text';
        const prompt = 'Correct the grammar.';

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: null
              }
            }]
          }), 5))
        );

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThan(0);
      });

      it('should return original text if OpenAI returns empty choices', async () => {
        const inputText = 'original text';
        const prompt = 'Correct the grammar.';

        mockCreate.mockResolvedValue({
          choices: []
        });

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThan(0);
      });

      it('should return original text if OpenAI throws/times out', async () => {
        const inputText = 'original text';
        const prompt = 'Correct the grammar.';

        mockCreate.mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI API error')), 5))
        );

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThan(0);
      });

      it('should handle timeout correctly', async () => {
        const inputText = 'original text';
        const prompt = 'Correct the grammar.';
        const shortTimeout = 100;

        // Mock a slow response
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'corrected text' })
              }
            }]
          }), 200))
        );

        const result = await getGrammarCorrection(inputText, prompt, shortTimeout);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThanOrEqual(shortTimeout);
      });

      it('should return duration as a positive integer', async () => {
        const inputText = 'test text';
        const prompt = 'Correct the grammar.';

        // Test successful case
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'corrected text' })
              }
            }]
          }), 5))
        );

        const successResult = await getGrammarCorrection(inputText, prompt);
        expect(successResult.duration).toBeGreaterThan(0);
        expect(Number.isInteger(successResult.duration)).toBe(true);

        // Test error case
        mockCreate.mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test error')), 5))
        );

        const errorResult = await getGrammarCorrection(inputText, prompt);
        expect(errorResult.duration).toBeGreaterThan(0);
        expect(Number.isInteger(errorResult.duration)).toBe(true);
      });

      it('should handle malformed JSON response', async () => {
        const inputText = 'test text';
        const prompt = 'Correct the grammar.';

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: 'invalid json {'
              }
            }]
          }), 5))
        );

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThan(0);
      });

      it('should handle JSON response without corrected field', async () => {
        const inputText = 'test text';
        const prompt = 'Correct the grammar.';

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ wrongField: 'some value' })
              }
            }]
          }), 5))
        );

        const result = await getGrammarCorrection(inputText, prompt);

        expect(result.correctedText).toBe(inputText);
        expect(result.duration).toBeGreaterThan(0);
      });

      it('should calculate max_tokens correctly', async () => {
        const shortText = 'hi';
        const longText = 'a'.repeat(2000);
        const prompt = 'Correct the grammar.';

        mockCreate.mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({ corrected: 'corrected' })
            }
          }]
        });

        // Test short text (should use minimum of 1000)
        await getGrammarCorrection(shortText, prompt);
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            max_tokens: 1000
          }),
          expect.any(Object)
        );

        mockCreate.mockClear();

        // Test long text (should use text.length * 2)
        await getGrammarCorrection(longText, prompt);
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            max_tokens: 4000
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('applyUserTransformations', () => {
    describe('Unit Tests', () => {
      beforeEach(() => {
        // Reset the mock before each test
        mockApplyWordTransformations.mockClear();
      });

      it('should apply all exact user transformations', () => {
        const text = 'Hello world test';
        const userTransformations = { hello: 'hi', world: 'earth' };
        const discardedFuzzy = {};
        const expectedResult = {
          transformedText: 'Hi earth test',
          fuzzyMatches: { hello: { originalWord: 'hello', correctedWord: 'hi', matchedKey: 'hello', score: 0 } }
        };

        mockApplyWordTransformations.mockReturnValue(expectedResult);

        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual(expectedResult);
        expect(mockApplyWordTransformations).toHaveBeenCalledWith(text, userTransformations, discardedFuzzy);
      });

      it('should return the original text and empty matches if userTransformations is empty', () => {
        const text = 'Hello world test';
        const userTransformations = {};
        const discardedFuzzy = {};

        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual({
          transformedText: text,
          fuzzyMatches: {}
        });
        expect(mockApplyWordTransformations).not.toHaveBeenCalled();
      });

      it('should apply fuzzy matches (if close to user transformation key) and not apply if discarded', () => {
        const text = 'helo world tset';
        const userTransformations = { hello: 'hi', test: 'exam' };
        const discardedFuzzy = { tset: 'test' }; // This fuzzy match should be discarded
        const expectedResult = {
          transformedText: 'hi world tset', // 'tset' should not be transformed because it's discarded
          fuzzyMatches: { helo: { originalWord: 'helo', correctedWord: 'hi', matchedKey: 'hello', score: 0.2 } }
        };

        mockApplyWordTransformations.mockReturnValue(expectedResult);

        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual(expectedResult);
        expect(mockApplyWordTransformations).toHaveBeenCalledWith(text, userTransformations, discardedFuzzy);
      });

      it('should never throw—returns fallback on error', () => {
        const text = 'Hello world';
        const userTransformations = { hello: 'hi' };
        const discardedFuzzy = {};

        // Mock the function to throw an error
        mockApplyWordTransformations.mockImplementation(() => {
          throw new Error('Transformation failed');
        });

        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual({
          transformedText: text,
          fuzzyMatches: {}
        });
        expect(console.warn).toHaveBeenCalledWith('Transformation failed:', expect.any(Error));
      });

      it('should handle null/undefined inputs gracefully', () => {
        const text = 'Hello world';
        const userTransformations = null as any;
        const discardedFuzzy = undefined as any;

        // This should not throw because of Object.keys check
        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual({
          transformedText: text,
          fuzzyMatches: {}
        });
        expect(mockApplyWordTransformations).not.toHaveBeenCalled();
      });

      it('should handle empty strings', () => {
        const text = '';
        const userTransformations = { hello: 'hi' };
        const discardedFuzzy = {};
        const expectedResult = {
          transformedText: '',
          fuzzyMatches: {}
        };

        mockApplyWordTransformations.mockReturnValue(expectedResult);

        const result = applyUserTransformations(text, userTransformations, discardedFuzzy);

        expect(result).toEqual(expectedResult);
        expect(mockApplyWordTransformations).toHaveBeenCalledWith(text, userTransformations, discardedFuzzy);
      });
    });
  });

  describe('processTextWithGrammarAndUserTransforms', () => {
    describe('Unit Tests', () => {
      beforeEach(() => {
        mockApplyWordTransformations.mockClear();
        
        // Default successful mock for getGrammarCorrection
        mockCreate.mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({ corrected: 'Grammar corrected text' })
            }
          }]
        });
      });

      it('should process text with grammar correction and user transformations', async () => {
        const inputText = 'original text with errors';
        const userPrompt = 'Custom prompt';
        const userTransformations = { errors: 'mistakes' };
        const discardedFuzzy = {};
        const expectedTransformedResult = {
          transformedText: 'Grammar corrected text with mistakes',
          fuzzyMatches: { errors: { originalWord: 'errors', correctedWord: 'mistakes', matchedKey: 'errors', score: 0 } }
        };

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        mockApplyWordTransformations.mockReturnValue(expectedTransformedResult);

        const result = await processTextWithGrammarAndUserTransforms(
          inputText, 
          userPrompt, 
          userTransformations, 
          discardedFuzzy
        );

        expect(result.correctedText).toBe(expectedTransformedResult.transformedText);
        expect(result.fuzzyMatches).toEqual(expectedTransformedResult.fuzzyMatches);
        expect(result.duration).toBeGreaterThan(0);
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({ content: userPrompt + ' Return ONLY the corrected text in JSON format: {"corrected": "..."}' })
            ])
          }),
          expect.any(Object)
        );
        expect(mockApplyWordTransformations).toHaveBeenCalledWith(
          'Grammar corrected text', 
          userTransformations, 
          discardedFuzzy
        );
      });

      it('should use default prompt when userPrompt is not provided', async () => {
        const inputText = 'test text';
        const userTransformations = {};
        const discardedFuzzy = {};

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        mockApplyWordTransformations.mockReturnValue({
          transformedText: 'Grammar corrected text',
          fuzzyMatches: {}
        });

        await processTextWithGrammarAndUserTransforms(inputText, undefined, userTransformations, discardedFuzzy);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({ 
                content: 'Correct the grammar and spelling in the following text. Return ONLY the corrected text in JSON format: {"corrected": "..."}'
              })
            ])
          }),
          expect.any(Object)
        );
      });

      it('should handle empty userTransformations and discardedFuzzy', async () => {
        const inputText = 'test text';
        const userPrompt = 'Custom prompt';

        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        // With empty userTransformations, applyWordTransformations should NOT be called
        // The function should return the grammar-corrected text directly
        const result = await processTextWithGrammarAndUserTransforms(inputText, userPrompt);

        expect(result.correctedText).toBe('Grammar corrected text');
        expect(result.fuzzyMatches).toEqual({});
        expect(result.duration).toBeGreaterThan(0);
        expect(mockApplyWordTransformations).not.toHaveBeenCalled();
      });

      it('should return original text and empty fuzzyMatches on error', async () => {
        const inputText = 'original text';
        const userPrompt = 'Custom prompt';
        const userTransformations = { test: 'exam' };
        const discardedFuzzy = {};

        // Mock getGrammarCorrection to fail - this should be mocked at the service level
        mockCreate.mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI API error')), 5))
        );

        const result = await processTextWithGrammarAndUserTransforms(
          inputText, 
          userPrompt, 
          userTransformations, 
          discardedFuzzy
        );

        expect(result.correctedText).toBe(inputText);
        expect(result.fuzzyMatches).toEqual({});
        expect(result.duration).toBeGreaterThan(0);
        expect(console.error).toHaveBeenCalledWith('Grammar correction error:', expect.any(Error));
      });

      it('should handle transformation errors gracefully', async () => {
        const inputText = 'test text';
        const userPrompt = 'Custom prompt';
        const userTransformations = { test: 'exam' };
        const discardedFuzzy = {};

        // Mock grammar correction to succeed
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        // Mock transformation to fail - this should cause the entire function to fail
        mockApplyWordTransformations.mockImplementation(() => {
          throw new Error('Transformation error');
        });

        const result = await processTextWithGrammarAndUserTransforms(
          inputText, 
          userPrompt, 
          userTransformations, 
          discardedFuzzy
        );

        expect(result.correctedText).toBe(inputText);
        expect(result.fuzzyMatches).toEqual({});
        expect(result.duration).toBeGreaterThan(0);
        expect(console.error).toHaveBeenCalledWith('Grammar correction error:', expect.any(Error));
      });

      it('should measure duration correctly', async () => {
        const inputText = 'test text';
        const userPrompt = 'Custom prompt';
        
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        mockApplyWordTransformations.mockReturnValue({
          transformedText: 'Grammar corrected text',
          fuzzyMatches: {}
        });

        const startTime = Date.now();
        const result = await processTextWithGrammarAndUserTransforms(inputText, userPrompt);
        const endTime = Date.now();

        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 100);
        expect(Number.isInteger(result.duration)).toBe(true);
      });

      it('should log correct messages', async () => {
        const inputText = 'test text for logging';
        const userPrompt = 'Custom prompt';
        const userTransformations = { logging: 'testing' }; // Add transformations so applyWordTransformations is called
        
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        mockApplyWordTransformations.mockReturnValue({
          transformedText: 'Final corrected text',
          fuzzyMatches: {}
        });

        await processTextWithGrammarAndUserTransforms(inputText, userPrompt, userTransformations);

        expect(console.log).toHaveBeenCalledWith('Starting grammar correction for text: "test text for logging..."');
        expect(console.log).toHaveBeenCalledWith('userPrompt', userPrompt);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Grammar correction completed in'));
        expect(console.log).toHaveBeenCalledWith('Original: "test text for logging"');
        expect(console.log).toHaveBeenCalledWith('Final: "Final corrected text"');
      });

      it('should handle long text logging truncation', async () => {
        const longText = 'a'.repeat(200);
        const userPrompt = 'Custom prompt';
        
        mockCreate.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({ corrected: 'Grammar corrected text' })
              }
            }]
          }), 5))
        );

        mockApplyWordTransformations.mockReturnValue({
          transformedText: 'Grammar corrected text',
          fuzzyMatches: {}
        });

        await processTextWithGrammarAndUserTransforms(longText, userPrompt);

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Starting grammar correction for text: "' + longText.substring(0, 100) + '..."')
        );
      });
    });
  });
});