import { applyWordTransformations } from '../textTransformations';

describe('applyWordTransformations', () => {
  beforeEach(() => {
    // Mock console.log to prevent test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replaces a single word exactly', () => {
    const text = 'hello world';
    const result = applyWordTransformations(text, { hello: 'hi' }, {});
    expect(result.transformedText).toBe('hi world');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('is case-insensitive for matching and preserves original casing', () => {
    const text = 'Hello HELLO hello';
    const result = applyWordTransformations(text, { hello: 'hi' }, {});
    expect(result.transformedText).toBe('Hi HI hi');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('does not replace part of a word but may create fuzzy matches', () => {
    const text = 'shell hello shelling';
    const result = applyWordTransformations(text, { hell: 'heaven', hello: 'hi' }, {});
    expect(result.transformedText).toBe('heaven hi shelling');
    expect(result.fuzzyMatches).toEqual({
      heaven: {
        originalWord: 'shell',
        correctedWord: 'heaven',
        matchedKey: 'hell',
        score: 0.2,
        position: 1
      }
    });
  });

  it('replaces multiple words in the text', () => {
    const text = 'cat dog mouse';
    const transformations = { cat: 'lion', dog: 'wolf' };
    const result = applyWordTransformations(text, transformations, {});
    expect(result.transformedText).toBe('lion wolf mouse');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('returns the same text if no transformations are given', () => {
    const text = 'just a normal sentence';
    const result = applyWordTransformations(text, {}, {});
    expect(result.transformedText).toBe(text);
    expect(result.fuzzyMatches).toEqual({});
  });

  it('returns the same text if there are no matches', () => {
    const text = 'there is nothing to change';
    const transformations = { hello: 'hi', world: 'earth' };
    const result = applyWordTransformations(text, transformations, {});
    expect(result.transformedText).toBe(text);
    expect(result.fuzzyMatches).toEqual({});
  });

  it('handles punctuation correctly', () => {
    const text = 'Hello, world! Hello...';
    const transformations = { hello: 'hi', world: 'earth' };
    const result = applyWordTransformations(text, transformations, {});
    expect(result.transformedText).toBe('Hi, earth! Hi...');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('handles empty string input', () => {
    const result = applyWordTransformations('', { hello: 'hi' }, {});
    expect(result.transformedText).toBe('');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('handles transformation values that are uppercase', () => {
    const text = 'good morning';
    const result = applyWordTransformations(text, { good: 'GREAT' }, {});
    expect(result.transformedText).toBe('GREAT morning');
    expect(result.fuzzyMatches).toEqual({});
  });

  it('respects discarded fuzzy matches', () => {
    const text = 'shell hello';
    const transformations = { hell: 'heaven', hello: 'hi' };
    const discardedFuzzy = { shell: 'hell' }; // Don't apply fuzzy match for shell->hell
    const result = applyWordTransformations(text, transformations, discardedFuzzy);
    expect(result.transformedText).toBe('shell hi');
    expect(result.fuzzyMatches).toEqual({});
  });
});