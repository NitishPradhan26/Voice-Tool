import { NextRequest, NextResponse } from 'next/server';
import { parseRequest, processTranscription } from '@/services/transcriptionService';

// Configure API route for handling large files
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

interface TranscriptionResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  duration?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<TranscriptionResponse>> {
  try {
    console.log('Transcription request received');

    // 1. Parse and validate request
    const { audioFile, prompt, uid } = await parseRequest(request);

    // 2. Core transcription (always happens)
    const result = await processTranscription(audioFile);

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      duration: result.duration
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return handleError(error);
  }
}

/**
 * Handle errors and return appropriate response
 */
function handleError(error: any): NextResponse<TranscriptionResponse> {
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
        error: 'Transcription timed out. Please try with a shorter audio file.'
      }, { status: 408 });
    }

    if (error.message.includes('No audio file') || error.message.includes('Unsupported file') || error.message.includes('File too large')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }

  return NextResponse.json({
    success: false,
    error: 'Unknown transcription error'
  }, { status: 500 });
}