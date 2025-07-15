import { NextRequest, NextResponse } from 'next/server';
import Fuse, { FuseResult } from 'fuse.js';
import vocab from '@/data/vocab.json';

// Initialize Fuse.js once when the module loads (server startup)
const fuse = new Fuse(vocab, {
  includeScore: true,
  threshold: 0.3,
});

function filterOutSelfMatch(results: FuseResult<string>[], input: string) {
  const cleanedInput = input.replace(/[^\w]/g, '').toLowerCase();
  return results.filter(
    r => r.item.replace(/[^\w]/g, '').toLowerCase() !== cleanedInput
  );
}

export async function GET(request: NextRequest) {
  try {
    // Get the word to search for from query params
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (!cleanWord) {
      return NextResponse.json({ suggestions: [] });
    }

    // Search for suggestions using Fuse.js
    let results = fuse.search(cleanWord);

    // Filter out self-match before limiting
    results = filterOutSelfMatch(results, cleanWord);
    results = results.slice(0, limit);

    const suggestions = results.map(r => ({
      word: r.item,
      score: r.score
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

