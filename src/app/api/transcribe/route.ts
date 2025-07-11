import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  const startTime = Date.now();

  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    // Initialize OpenAI client at runtime
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    console.log('Received request with formData keys:', Array.from(formData.keys()));
    console.log('Audio file:', audioFile ? {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    } : 'null');

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
    const maxSize = 25 * 1024 * 1024; // 25MB limit (OpenAI's limit)

    // Handle webm with codecs
    const isWebmWithCodecs = audioFile.type.startsWith('audio/webm');
    const isValidType = allowedTypes.includes(audioFile.type) || isWebmWithCodecs;

    if (!isValidType) {
      return NextResponse.json({
        success: false,
        error: `Unsupported file type: ${audioFile.type}. Supported types: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    if (audioFile.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `File too large: ${Math.round(audioFile.size / 1024 / 1024)}MB. Maximum size: 25MB`
      }, { status: 400 });
    }

    // Convert File to Buffer for OpenAI API
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Create a File-like object that OpenAI expects
    const openaiFile = new File([audioBuffer], audioFile.name, {
      type: audioFile.type,
    });

    console.log(`Transcribing audio file: ${audioFile.name} (${audioFile.type}, ${Math.round(audioFile.size / 1024)}KB)`);

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: openaiFile,
      model: 'whisper-1', // This is the large model
      language: 'en', // Optional: specify language for better accuracy
      response_format: 'text',
      temperature: 0.2, // Lower temperature for more consistent results
    });

    const duration = Date.now() - startTime;

    console.log(`Transcription completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      transcript: transcription,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Transcription error:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid OpenAI API key',
          duration
        }, { status: 401 });
      }

      if (error.message.includes('quota')) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI API quota exceeded',
          duration
        }, { status: 429 });
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          duration
        }, { status: 429 });
      }

      return NextResponse.json({
        success: false,
        error: error.message,
        duration
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown transcription error',
      duration
    }, { status: 500 });
  }
}