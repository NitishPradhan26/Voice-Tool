import { NextRequest, NextResponse } from 'next/server';
import { processTextWithGrammarAndUserTransforms } from '@/services/grammarService';
import { FuzzyMatchMap } from '@/utils/textTransformations';

// Configure API route
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

interface GrammarCorrectionResponse {
  success: boolean;
  correctedText?: string;
  originalText?: string;
  error?: string;
  duration?: number;
  fuzzyMatches?: FuzzyMatchMap;
}

export async function POST(request: NextRequest): Promise<NextResponse<GrammarCorrectionResponse>> {
  try {
    console.log('Grammar correction request received');

    const body = await request.json();
    const { text, userPrompt, userTransformations, discardedFuzzy } = body;

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Text is required and must be a string' 
        },
        { status: 400 }
      );
    }

    // Skip grammar correction for very short texts
    if (text.trim().length < 10) {
      return NextResponse.json({
        success: true,
        correctedText: text,
        originalText: text,
        duration: 0,
        fuzzyMatches: {}
      });
    }

    // Perform grammar correction and apply user transformations
    const result = await processTextWithGrammarAndUserTransforms(
      text, 
      userPrompt, 
      userTransformations || {}, 
      discardedFuzzy || {}
    );

    return NextResponse.json({
      success: true,
      correctedText: result.correctedText,
      originalText: text,
      duration: result.duration,
      fuzzyMatches: result.fuzzyMatches
    });

  } catch (error) {
    console.error('Grammar correction error:', error);
    return handleGrammarError(error);
  }
}

/**
 * Handle grammar correction errors and return appropriate response
 */
function handleGrammarError(error: any): NextResponse<GrammarCorrectionResponse> {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid OpenAI API key'
      }, { status: 401 });
    }

    if (error.message.includes('quota')) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API quota exceeded'
      }, { status: 429 });
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 });
    }

    if (error.message.includes('timed out') || error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Grammar correction timed out. Please try again.'
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }

  return NextResponse.json({
    success: false,
    error: 'Unknown grammar correction error'
  }, { status: 500 });
}