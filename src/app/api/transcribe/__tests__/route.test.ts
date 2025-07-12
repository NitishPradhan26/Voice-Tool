import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockCreate
      }
    }
  }))
}));

describe('/api/transcribe POST', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

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

  describe('1. API Key Validation', () => {
    it('returns 500 when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const formData = createFormDataWithFile(Buffer.alloc(1024), 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        success: false,
        error: 'OpenAI API key not configured'
      });
    });

    it('returns 500 when OPENAI_API_KEY is empty string', async () => {
      process.env.OPENAI_API_KEY = '';
      
      const formData = createFormDataWithFile(Buffer.alloc(1024), 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        success: false,
        error: 'OpenAI API key not configured'
      });
    });
  });

  describe('2. No File in Request', () => {
    it('returns 400 when no audio file is provided', async () => {
      const formData = new FormData(); // Empty FormData
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        success: false,
        error: 'No audio file provided'
      });
    });

    it('returns 400 when audio field is null', async () => {
      const formData = new FormData();
      formData.append('audio', 'null');
      formData.delete('audio'); // Remove it to simulate null
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        success: false,
        error: 'No audio file provided'
      });
    });

    it('returns 400 when wrong field name is used', async () => {
      const formData = new FormData();
      const file = new File([Buffer.alloc(1024)], 'test.webm', { type: 'audio/webm' });
      formData.append('wrong_field', file); // Wrong field name
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        success: false,
        error: 'No audio file provided'
      });
    });
  });

  describe('3. Weird File Types', () => {
    it('rejects image files (PNG)', async () => {
      const formData = createFormDataWithFile(
        Buffer.from('fake png data'), 
        'image.png', 
        'image/png'
      );
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported file type: image/png');
      expect(responseData.error).toContain('Supported types:');
    });

    it('rejects video files (MP4)', async () => {
      const formData = createFormDataWithFile(
        Buffer.from('fake mp4 data'), 
        'video.mp4', 
        'video/mp4'
      );
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported file type: video/mp4');
    });

    it('rejects text files', async () => {
      const formData = createFormDataWithFile(
        Buffer.from('This is just text'), 
        'document.txt', 
        'text/plain'
      );
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported file type: text/plain');
    });

    it('rejects JavaScript files', async () => {
      const formData = createFormDataWithFile(
        Buffer.from('console.log("malicious code")'), 
        'script.js', 
        'application/javascript'
      );
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported file type: application/javascript');
    });

    it('accepts valid audio types', async () => {
      const validTypes = [
        'audio/webm',
        'audio/wav', 
        'audio/mp3',
        'audio/m4a',
        'audio/ogg'
      ];

      for (const mimeType of validTypes) {
        mockCreate.mockResolvedValueOnce('Test transcription');
        
        const formData = createFormDataWithFile(
          Buffer.alloc(1024), 
          `test.${mimeType.split('/')[1]}`, 
          mimeType
        );
        const request = createMockRequest(formData);
        
        const response = await POST(request);
        
        expect(response.status).not.toBe(400);
      }
    });

    it('accepts webm with codecs', async () => {
      mockCreate.mockResolvedValue('Test transcription');
      
      const formData = createFormDataWithFile(
        Buffer.alloc(1024), 
        'test.webm', 
        'audio/webm;codecs=opus'
      );
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      
      expect(response.status).not.toBe(400);
    });
  });

  describe('4. File Too Large', () => {
    it('rejects files larger than 4.5MB', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const formData = createFormDataWithFile(largeBuffer, 'large.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('File too large: 5MB');
      expect(responseData.error).toContain('Maximum size: 25MB');
    });

    it('rejects extremely large files (10MB)', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      const formData = createFormDataWithFile(largeBuffer, 'huge.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('File too large: 10MB');
    });

    it('accepts files exactly at 4.5MB limit', async () => {
      mockCreate.mockResolvedValue('Test transcription');
      
      const maxSizeBuffer = Buffer.alloc(4.5 * 1024 * 1024); // Exactly 4.5MB
      const formData = createFormDataWithFile(maxSizeBuffer, 'max-size.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      
      expect(response.status).not.toBe(400); // Should not be rejected for size
    });

    it('accepts small files', async () => {
      mockCreate.mockResolvedValue('Test transcription');
      
      const smallBuffer = Buffer.alloc(1024); // 1KB
      const formData = createFormDataWithFile(smallBuffer, 'small.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      
      expect(response.status).not.toBe(400);
    });
  });

  describe('5. Happy Path', () => {
    it('successfully transcribes valid audio file', async () => {
      const expectedTranscript = 'Hello, this is a test transcription';
      mockCreate.mockResolvedValue(expectedTranscript);
      
      const audioBuffer = Buffer.alloc(2048); // 2KB file
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        transcript: expectedTranscript,
        duration: expect.any(Number)
      });
      
      // Verify OpenAI was called correctly
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

    it('includes duration in response', async () => {
      mockCreate.mockResolvedValue('Quick response');
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();
      const responseData = await response.json();
      
      expect(responseData.duration).toBeGreaterThanOrEqual(0);
      expect(responseData.duration).toBeLessThanOrEqual(endTime - startTime + 100); // Small buffer
    });
  });

  describe('6. Slow OpenAI / Timeout Scenarios', () => {
    it('handles OpenAI timeout after 45 seconds', async () => {
      // Mock OpenAI to timeout
      mockCreate.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Transcription timed out after 45 seconds'));
          }, 100); // Simulate timeout quickly for test
        })
      );
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(408);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Transcription took too long to process');
      expect(responseData.duration).toBeGreaterThan(0);
    });

    it('handles AbortError from timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockCreate.mockRejectedValue(abortError);
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(408);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Transcription was cancelled due to timeout.');
    });

    it('handles OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid API key'));
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid OpenAI API key');
    });

    it('handles OpenAI quota exceeded', async () => {
      mockCreate.mockRejectedValue(new Error('You have exceeded your quota'));
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(429);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('OpenAI API quota exceeded');
    });

    it('handles rate limit errors', async () => {
      mockCreate.mockRejectedValue(new Error('rate limit exceeded'));
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(429);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Rate limit exceeded. Please try again later.');
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed FormData', async () => {
      const request = {
        formData: jest.fn().mockRejectedValue(new Error('Invalid FormData'))
      } as unknown as NextRequest;
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid FormData');
    });

    it('handles unknown errors', async () => {
      mockCreate.mockRejectedValue('Unknown error'); // Not an Error object
      
      const audioBuffer = Buffer.alloc(1024);
      const formData = createFormDataWithFile(audioBuffer, 'test.webm');
      const request = createMockRequest(formData);
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unknown transcription error');
    });
  });
});