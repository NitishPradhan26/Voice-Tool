import { applyWordTransformations } from '../textTransformations';

describe('applyWordTransformations', () => {
  it('replaces a single word exactly', () => {
    const text = 'hello world';
    const result = applyWordTransformations(text, { hello: 'hi' });
    expect(result).toBe('hi world');
  });

  it('is case-insensitive for matching and preserves original casing', () => {
    const text = 'Hello HELLO hello';
    const result = applyWordTransformations(text, { hello: 'hi' });
    expect(result).toBe('Hi HI hi');
  });

  
  it('does not replace part of a word', () => {
    const text = 'shell hello shelling';
    const result = applyWordTransformations(text, { hell: 'heaven', hello: 'hi' });
    expect(result).toBe('shell hi shelling');
  });

  it('replaces multiple words in the text', () => {
    const text = 'cat dog mouse';
    const transformations = { cat: 'lion', dog: 'wolf' };
    const result = applyWordTransformations(text, transformations);
    expect(result).toBe('lion wolf mouse');
  });

  it('returns the same text if no transformations are given', () => {
    const text = 'just a normal sentence';
    expect(applyWordTransformations(text, {})).toBe(text);
  });

  it('returns the same text if there are no matches', () => {
    const text = 'there is nothing to change';
    const transformations = { hello: 'hi', world: 'earth' };
    expect(applyWordTransformations(text, transformations)).toBe(text);
  });

  it('handles punctuation correctly', () => {
    const text = 'Hello, world! Hello...';
    const transformations = { hello: 'hi', world: 'earth' };
    expect(applyWordTransformations(text, transformations)).toBe('Hi, earth! Hi...');
  });

  it('handles empty string input', () => {
    expect(applyWordTransformations('', { hello: 'hi' })).toBe('');
  });

  it('handles transformation values that are uppercase', () => {
    const text = 'good morning';
    const result = applyWordTransformations(text, { good: 'GREAT' });
    expect(result).toBe('GREAT morning');
  });
});