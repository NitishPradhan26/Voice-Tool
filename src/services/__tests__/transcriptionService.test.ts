import { NextRequest } from 'next/server';
import { parseRequest, processTranscription } from '../transcriptionService';
import { getOpenAIClient } from '../../lib/openAI';

// Mock OpenAI client
const mockCreate = jest.fn();
const mockGetOpenAIClient = jest.mocked(getOpenAIClient);

jest.mock('../../lib/openAI', () => ({
  getOpenAIClient: jest.fn()
}));

describe('transcriptionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Setup default mock for getOpenAIClient
    mockGetOpenAIClient.mockReturnValue({
      audio: {
        transcriptions: {
          create: mockCreate
        }
      }
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parseRequest', () => {
    // Helper function to create FormData with audio file
    const createFormDataWithFile = (fileBuffer: Buffer, fileName: string, mimeType: string = 'audio/webm') => {
      const formData = new FormData();
      const file = new File([fileBuffer], fileName, { type: mimeType });
      formData.append('audio', file);
      return formData;
    };

    // Helper function to create mock request
    const createMockRequest = (formData: FormData): NextRequest => {
      return {
        formData: jest.fn().mockResolvedValue(formData),
      } as unknown as NextRequest;
    };

    it('successfully parses valid audio file', async () => {
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      formData.append('prompt', 'Test prompt');
      formData.append('uid', 'user123');

      const request = createMockRequest(formData);
      const result = await parseRequest(request);

      expect(result.audioFile).toBeDefined();
      expect(result.audioFile.name).toBe('test.webm');
      expect(result.audioFile.type).toBe('audio/webm');
      expect(result.prompt).toBe('Test prompt');
      expect(result.uid).toBe('user123');
    });

    it('handles missing optional fields', async () => {
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');

      const request = createMockRequest(formData);
      const result = await parseRequest(request);

      expect(result.audioFile).toBeDefined();
      expect(result.prompt).toBeUndefined();
      expect(result.uid).toBeUndefined();
    });

    it('throws error when no audio file is provided', async () => {
      const formData = new FormData();
      const request = createMockRequest(formData);

      await expect(parseRequest(request)).rejects.toThrow('No audio file provided');
    });

    it('validates supported audio file types', async () => {
      const validTypes = [
        'audio/webm',
        'audio/wav',
        'audio/mp3',
        'audio/m4a',
        'audio/ogg'
      ];

      for (const mimeType of validTypes) {
        const formData = createFormDataWithFile(Buffer.alloc(1024), `test.${mimeType.split('/')[1]}`, mimeType);
        const request = createMockRequest(formData);

        const result = await parseRequest(request);
        expect(result.audioFile.type).toBe(mimeType);
      }
    });

    it('accepts webm with codecs', async () => {
      const formData = createFormDataWithFile(Buffer.alloc(1024), 'test.webm', 'audio/webm;codecs=opus');
      const request = createMockRequest(formData);

      const result = await parseRequest(request);
      expect(result.audioFile.type).toBe('audio/webm;codecs=opus');
    });

    it('rejects unsupported file types', async () => {
      const unsupportedTypes = [
        'image/png',
        'video/mp4',
        'text/plain',
        'application/javascript'
      ];

      for (const mimeType of unsupportedTypes) {
        const formData = createFormDataWithFile(Buffer.alloc(1024), `test.${mimeType.split('/')[1]}`, mimeType);
        const request = createMockRequest(formData);

        await expect(parseRequest(request)).rejects.toThrow(`Unsupported file type: ${mimeType}`);
      }
    });

    it('rejects files larger than 4.5MB', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const formData = createFormDataWithFile(largeBuffer, 'large.webm');
      const request = createMockRequest(formData);

      await expect(parseRequest(request)).rejects.toThrow('File too large: 5MB. Maximum size: 4.5MB');
    });

    it('accepts files at exactly 4.5MB limit', async () => {
      const maxSizeBuffer = Buffer.alloc(4.5 * 1024 * 1024); // Exactly 4.5MB
      const formData = createFormDataWithFile(maxSizeBuffer, 'max-size.webm');
      const request = createMockRequest(formData);

      const result = await parseRequest(request);
      expect(result.audioFile.size).toBe(4.5 * 1024 * 1024);
    });

    it('handles malformed FormData', async () => {
      const request = {
        formData: jest.fn().mockRejectedValue(new Error('Invalid FormData'))
      } as unknown as NextRequest;

      await expect(parseRequest(request)).rejects.toThrow('Invalid FormData');
    });
  });

  describe('processTranscription', () => {
    it('successfully transcribes audio file', async () => {
      const expectedTranscript = 'Hello, this is a test transcription';
      mockCreate.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(expectedTranscript), 10))
      );

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      const result = await processTranscription(audioFile);

      expect(result.transcript).toBe(expectedTranscript);
      expect(result.duration).toBeGreaterThan(0);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'whisper-1',
          language: 'en',
          response_format: 'text',
          temperature: 0.2,
          file: expect.any(File)
        }),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });


    it('handles OpenAI API timeout', async () => {
      mockCreate.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Transcription timed out after 45 seconds'));
          }, 100);
        })
      );

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      await expect(processTranscription(audioFile)).rejects.toThrow('Transcription timed out after 45 seconds');
    });

    it('handles AbortError from timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockCreate.mockRejectedValue(abortError);

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      await expect(processTranscription(audioFile)).rejects.toThrow('The operation was aborted');
    });

    it('handles OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid API key'));

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      await expect(processTranscription(audioFile)).rejects.toThrow('Invalid API key');
    });

    it('handles quota exceeded errors', async () => {
      mockCreate.mockRejectedValue(new Error('You have exceeded your quota'));

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      await expect(processTranscription(audioFile)).rejects.toThrow('You have exceeded your quota');
    });

    it('handles rate limit errors', async () => {
      mockCreate.mockRejectedValue(new Error('rate limit exceeded'));

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      await expect(processTranscription(audioFile)).rejects.toThrow('rate limit exceeded');
    });

    it('measures transcription duration accurately', async () => {
      const expectedTranscript = 'Quick response';
      mockCreate.mockResolvedValue(expectedTranscript);

      const audioFile = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      
      const startTime = Date.now();
      const result = await processTranscription(audioFile);
      const endTime = Date.now();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeLessThanOrEqual(endTime - startTime + 100); // Small buffer for timing
    });

    it('converts File to proper format for OpenAI API', async () => {
      const expectedTranscript = 'File conversion test';
      mockCreate.mockResolvedValue(expectedTranscript);

      const originalBuffer = Buffer.from('test audio data');
      const audioFile = new File([originalBuffer], 'test.webm', { type: 'audio/webm' });
      
      await processTranscription(audioFile);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            name: 'test.webm',
            type: 'audio/webm'
          })
        }),
        expect.any(Object)
      );
    });

    it('handles different audio file types', async () => {
      const audioTypes = [
        { type: 'audio/webm', name: 'test.webm' },
        { type: 'audio/wav', name: 'test.wav' },
        { type: 'audio/mp3', name: 'test.mp3' },
        { type: 'audio/m4a', name: 'test.m4a' },
        { type: 'audio/ogg', name: 'test.ogg' }
      ];

      for (const audioType of audioTypes) {
        mockCreate.mockResolvedValue('Transcription result');
        
        const audioFile = new File([Buffer.alloc(1024)], audioType.name, { type: audioType.type });
        const result = await processTranscription(audioFile);

        expect(result.transcript).toBe('Transcription result');
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            file: expect.objectContaining({
              name: audioType.name,
              type: audioType.type
            })
          }),
          expect.any(Object)
        );

        mockCreate.mockClear();
      }
    });
  });
});