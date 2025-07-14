import { NextRequest } from 'next/server';
import OpenAI from 'openai';

interface TranscriptionResult {
  transcript: string;
  duration: number;
}

interface ParsedRequest {
  audioFile: File;
  prompt?: string;
  uid?: string;
}

/**
 * Parse and validate the transcription request
 * @param request - NextRequest object
 * @returns Promise<ParsedRequest> - Parsed request data
 */
export async function parseRequest(request: NextRequest): Promise<ParsedRequest> {
  // Parse multipart form data
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  const prompt = formData.get('prompt') as string;
  const uid = formData.get('uid') as string;

  console.log('Received request with formData keys:', Array.from(formData.keys()));
  console.log('Audio file:', audioFile ? {
    name: audioFile.name,
    size: audioFile.size,
    type: audioFile.type
  } : 'null');
  console.log('Prompt:', prompt || 'No prompt provided');
  console.log('UID:', uid || 'No UID provided');

  if (!audioFile) {
    throw new Error('No audio file provided');
  }

  // Validate file type and size
  const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
  const maxSize = 4.5 * 1024 * 1024; // 4.5MB limit

  // Handle webm with codecs
  const isWebmWithCodecs = audioFile.type.startsWith('audio/webm');
  const isValidType = allowedTypes.includes(audioFile.type) || isWebmWithCodecs;

  if (!isValidType) {
    throw new Error(`Unsupported file type: ${audioFile.type}. Supported types: ${allowedTypes.join(', ')}`);
  }

  if (audioFile.size > maxSize) {
    throw new Error(`File too large: ${Math.round(audioFile.size / 1024 / 1024)}MB. Maximum size: 4.5MB`);
  }

  return {
    audioFile,
    prompt: prompt || undefined,
    uid: uid || undefined
  };
}

/**
 * Process audio transcription using OpenAI Whisper
 * @param audioFile - Audio file to transcribe
 * @param prompt - Optional prompt for transcription context
 * @returns Promise<TranscriptionResult> - Transcription result with duration
 */
export async function processTranscription(
  audioFile: File, 
  prompt?: string
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Convert File to Buffer for OpenAI API
  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  // Create a File-like object that OpenAI expects
  const openaiFile = new File([audioBuffer], audioFile.name, {
    type: audioFile.type,
  });

  console.log(`Transcribing audio file: ${audioFile.name} (${audioFile.type}, ${Math.round(audioFile.size / 1024)}KB)`);

  // Set up timeout for OpenAI API call
  const WHISPER_TIMEOUT = 45000; // 45 seconds timeout
  const controller = new AbortController();
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Transcription timed out after ${WHISPER_TIMEOUT / 1000} seconds`));
    }, WHISPER_TIMEOUT);
  });

  // Call OpenAI Whisper API with timeout
  const transcriptionParams: any = {
    file: openaiFile,
    model: 'whisper-1', // This is the large model
    language: 'en', // Optional: specify language for better accuracy
    response_format: 'text',
    temperature: 0.2, // Lower temperature for more consistent results
  };
  
  // Add prompt if provided
  if (prompt) {
    transcriptionParams.prompt = prompt;
  }
  
  const transcriptionPromise = openai.audio.transcriptions.create(transcriptionParams, {
    signal: controller.signal // Pass abort signal
  });

  // Race between transcription and timeout
  const transcription = await Promise.race([
    transcriptionPromise,
    timeoutPromise
  ]);

  const duration = Date.now() - startTime;
  console.log(`Transcription completed in ${duration}ms`);

  return {
    transcript: String(transcription),
    duration
  };
}