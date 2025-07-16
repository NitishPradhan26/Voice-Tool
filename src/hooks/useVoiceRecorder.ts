import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { FuzzyMatchMap } from '@/utils/textTransformations';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'awaiting_confirmation' | 'transcribing' | 'correcting_grammar';

// Pure function for audio blob validation (extracted for testing)
export const validateAudioBlobPure = (blob: Blob): string | null => {
  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB in bytes
  const MIN_FILE_SIZE = 1000; // 1KB minimum (reasonable minimum for audio)

  if (blob.size < MIN_FILE_SIZE) {
    return 'Received empty audio, please try again';
  }

  if (blob.size > MAX_FILE_SIZE) {
    return 'The audio is too long, can\'t process it';
  }

  return null;
};

// Pure function for transcription result validation
export const validateTranscriptionResult = (transcript: string): string | null => {
  if (!transcript) {
    return 'No speech detected in the audio. Please try speaking louder or closer to the microphone.';
  }

  const trimmedTranscript = transcript.trim();
  
  if (trimmedTranscript.length === 0) {
    return 'No speech detected in the audio. Please try speaking louder or closer to the microphone.';
  }

  // Check if transcript is too short (likely just background noise)
  if (trimmedTranscript.length < 3) {
    return 'Very short audio detected. Please try speaking for a longer duration.';
  }

  // Check for common Whisper "no speech" indicators
  const exactNoSpeechPhrases = [
    'thank you',
    'thanks',
    'thank you for watching',
    'bye',
    'music',
    'silence'
  ];

  const shortFillerWords = ['uh', 'um', 'you', '...', '..'];

  const lowerTranscript = trimmedTranscript.toLowerCase().replace(/[^\w\s]/g, ''); // Remove punctuation
  
  // Check for exact phrase matches
  const isExactNoSpeechPhrase = exactNoSpeechPhrases.some(phrase => 
    lowerTranscript === phrase
  );
  
  // Check for very short transcripts that are just filler words
  const isShortFillerOnly = lowerTranscript.length <= 10 && shortFillerWords.some(filler => 
    lowerTranscript === filler
  );
  
  const isLikelyNoise = isExactNoSpeechPhrase || isShortFillerOnly;

  if (isLikelyNoise) {
    return 'Only background noise or filler words detected. Please try speaking more clearly.';
  }

  return null;
};

interface UseVoiceRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  confirmTranscription: () => Promise<void>;
  cancelRecording: () => void;
  audioBlob: Blob | null;
  transcript: string | null;
  error: string | null;
  audioDuration: number;
  wordCount: number;
  fuzzyMatches: FuzzyMatchMap;
  handleWordCorrection: (originalWord: string, correctedWord: string) => Promise<void>;
  revertFuzzyMatch: (correctedWord: string, originalWord: string) => void;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const { user } = useAuth();
  const { userData, addCorrection } = useUserData();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatchMap>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setTranscript(null);
      setAudioDuration(0);
      setWordCount(0);
      setFuzzyMatches({});
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        // Log blob for verification (Step 0 requirement)
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          blob: audioBlob
        });

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());

        // Validate audio blob before transcription
        const validationError = validateAudioBlob(audioBlob);
        if (validationError) {
          setError(validationError);
          setRecordingState('idle');
          return;
        }

        // Set state to await user confirmation
        setRecordingState('awaiting_confirmation');
      };

      // Start recording
      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setRecordingState('recording');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      setRecordingState('processing');
      
      // Calculate audio duration
      if (recordingStartTimeRef.current) {
        const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setAudioDuration(duration);
      }
      
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const validateAudioBlob = useCallback((blob: Blob): string | null => {
    return validateAudioBlobPure(blob);
  }, []);

  const validateTranscription = useCallback((transcript: string): string | null => {
    return validateTranscriptionResult(transcript);
  }, []);

  const transcribeAudioBlob = useCallback(async (blob: Blob) => {
    try {
      setRecordingState('transcribing');
      setError(null);

      console.log('Sending audio blob:', {
        size: blob.size,
        type: blob.type,
        name: 'recording.webm'
      });

      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      if (userData.prompt) {
        formData.append('prompt', userData.prompt);
      }
      if (user) {
        formData.append('uid', user.uid);
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const originalTranscript = result.transcript;
        console.log('Transcription completed:', originalTranscript);
        
        // Validate transcription result
        const transcriptionError = validateTranscription(originalTranscript);
        if (transcriptionError) {
          setError(transcriptionError);
          setRecordingState('idle');
          return;
        }
        
        // Step 2: Grammar correction
        try {
          setRecordingState('correcting_grammar');
          console.log('Starting grammar correction...');
          
          const grammarResponse = await fetch('/api/grammar/correct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: originalTranscript,
              userPrompt: userData.prompt,
              uid: user?.uid
            }),
          });
          
          if (!grammarResponse.ok) {
            throw new Error(`Grammar correction failed: ${grammarResponse.status}`);
          }
          
          const grammarResult = await grammarResponse.json();
          
          if (grammarResult.success) {
            const finalTranscript = grammarResult.correctedText;
            setTranscript(finalTranscript);
            setFuzzyMatches(grammarResult.fuzzyMatches || {});
            
            // Calculate word count for final corrected transcript
            const words = finalTranscript.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
            
            console.log('Grammar correction completed:', finalTranscript);
            console.log('Fuzzy matches found:', grammarResult.fuzzyMatches);
          } else {
            console.warn('Grammar correction failed, using original transcript:', grammarResult.error);
            // Use original transcript if grammar correction fails
            setTranscript(originalTranscript);
            
            // Calculate word count for original transcript
            const words = originalTranscript.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWordCount(words.length);
          }
        } catch (grammarError) {
          console.warn('Grammar correction error, using original transcript:', grammarError);
          // Use original transcript if grammar correction fails
          setTranscript(originalTranscript);
          
          // Calculate word count for original transcript
          const words = originalTranscript.trim().split(/\s+/).filter((word: string) => word.length > 0);
          setWordCount(words.length);
        }
      } else {
        console.error('API Error Response:', result);
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setRecordingState('idle');
    }
  }, [userData.prompt, validateTranscription]);

  const confirmTranscription = useCallback(async () => {
    if (audioBlob && recordingState === 'awaiting_confirmation') {
      await transcribeAudioBlob(audioBlob);
    }
  }, [audioBlob, recordingState, transcribeAudioBlob]);

  const updateTranscriptWithCorrection = useCallback((originalWord: string, correctedWord: string) => {
    setTranscript(prevTranscript => {
      if (!prevTranscript) return prevTranscript;
      
      // Replace all instances of the original word with the corrected word
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      return prevTranscript.replace(regex, correctedWord);
    });
  }, []);

  const handleWordCorrection = useCallback(async (originalWord: string, correctedWord: string) => {
    try {
      await addCorrection(originalWord, correctedWord);
      updateTranscriptWithCorrection(originalWord, correctedWord);
      console.log(`Word correction saved: "${originalWord}" → "${correctedWord}"`);
    } catch (error) {
      console.error('Error saving word correction:', error);
    }
  }, [addCorrection, updateTranscriptWithCorrection]);

  const revertFuzzyMatch = useCallback((correctedWord: string, originalWord: string) => {
    setTranscript(prevTranscript => {
      if (!prevTranscript) return prevTranscript;
      
      // Replace the corrected word back to the original word
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${correctedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      return prevTranscript.replace(regex, originalWord);
    });
    
    // Remove the fuzzy match from the map since it's been reverted
    setFuzzyMatches(prevMatches => {
      const newMatches = { ...prevMatches };
      delete newMatches[correctedWord];
      return newMatches;
    });
    
    console.log(`Fuzzy match reverted: "${correctedWord}" → "${originalWord}"`);
  }, []);

  const cancelRecording = useCallback(() => {
    if (recordingState === 'awaiting_confirmation') {
      setAudioBlob(null);
      setTranscript(null);
      setError(null);
      setAudioDuration(0);
      setWordCount(0);
      setFuzzyMatches({});
      setRecordingState('idle');
    }
  }, [recordingState]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    confirmTranscription,
    cancelRecording,
    audioBlob,
    transcript,
    error,
    audioDuration,
    wordCount,
    fuzzyMatches,
    handleWordCorrection,
    revertFuzzyMatch
  };
};