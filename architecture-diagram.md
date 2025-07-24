# Voice Transcription Tool - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 Browser (Client Side)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐ │
│  │                     │    │                      │    │                     │ │
│  │    page.tsx         │    │   VoiceRecorder.tsx  │    │   Browser APIs     │ │
│  │                     │    │                      │    │                     │ │
│  │  - Main App Page    │───▶│  - Recording UI      │───▶│  - MediaRecorder    │ │
│  │  - Layout           │    │  - State Display     │    │  - navigator.media  │ │
│  │  - Component Host   │    │  - User Interaction  │    │  - Clipboard API    │ │
│  │                     │    │                      │    │                     │ │
│  └─────────────────────┘    └──────────────────────┘    └─────────────────────┘ │
│                                       │                                         │
│  ┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐ │
│  │                     │    │                      │    │                     │ │
│  │  TranscriptDisplay  │    │   ClickableWord      │    │   Settings.tsx     │ │
│  │     .tsx            │    │     .tsx             │    │                     │ │
│  │                     │    │                      │    │  - User Preferences │ │
│  │  - Word Rendering   │───▶│  - Word Correction   │    │  - Grammar Prompts  │ │
│  │  - Click Handlers   │    │  - Suggestions UI    │    │  - Word Management  │ │
│  │  - Fuzzy Matching   │    │  - User Input        │    │                     │ │
│  │                     │    │                      │    │                     │ │
│  └─────────────────────┘    └──────────────────────┘    └─────────────────────┘ │
│                                       │                                         │
│                   ┌───────────────────┴───────────────────┐                     │
│                   │                                       │                     │
│                   │        useVoiceRecorder.ts            │                     │
│                   │                                       │                     │
│                   │  - State Management (idle/recording/  │                     │
│                   │    processing/transcribing)           │                     │
│                   │  - MediaRecorder Logic                │                     │
│                   │  - Audio Blob Creation                │                     │
│                   │  - API Communication                  │                     │
│                   │  - Error Handling                     │                     │
│                   │                                       │                     │
│                   └───────────────────────────────────────┘                     │
│                                       │                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Context Providers                                  │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐              ┌─────────────────────┐               │ │
│  │  │   AuthContext.tsx   │              │ UserDataContext.tsx │               │ │
│  │  │                     │              │                     │               │ │
│  │  │  - Firebase Auth    │              │  - User Data State  │               │ │
│  │  │  - Google Sign-In   │              │  - Word Corrections │               │ │
│  │  │  - User Session     │              │  - Grammar Prompts  │               │ │
│  │  │                     │              │  - Fuzzy Matches    │               │ │
│  │  └─────────────────────┘              └─────────────────────┘               │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
└───────────────────────────────────────┼─────────────────────────────────────────┘
                                        │
                                        │ HTTP API Calls
                                        │ (Multiple Endpoints)
                                        │
┌───────────────────────────────────────┼─────────────────────────────────────────┐
│                                       │                                         │
│                            Next.js API Routes (Server Side)                    │
│                                       │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                    /api/transcribe/route.ts                                 │ │
│  │                                                                             │ │
│  │  - Serverless Function (Vercel)                                            │ │
│  │  - File Validation (type, size < 4.5MB)                                    │ │
│  │  - OpenAI Whisper Integration                                              │ │
│  │  - Audio Processing (45s timeout)                                          │ │
│  │  - Error Handling & Logging                                                │ │
│  │                                                                             │ │
│  └─────────────────────────────────────┬───────────────────────────────────────┘ │
│                                        │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                 /api/grammar/correct/route.ts                               │ │
│  │                                                                             │ │
│  │  - Grammar correction using GPT-4                                          │ │
│  │  - User transformation application                                          │ │
│  │  - Fuzzy matching integration                                              │ │
│  │  - 30s timeout for processing                                              │ │
│  │                                                                             │ │
│  └─────────────────────────────────────┬───────────────────────────────────────┘ │
│                                        │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                      /api/user/* Routes                                     │ │
│  │                                                                             │ │
│  │  - /api/user/prompt (GET/PUT)                                              │ │
│  │  - /api/user/transformations (GET/POST)                                    │ │
│  │  - /api/user/discarded-fuzzy (GET/POST)                                    │ │
│  │  - Firebase Firestore integration                                          │ │
│  │                                                                             │ │
│  └─────────────────────────────────────┬───────────────────────────────────────┘ │
│                                        │                                         │
└────────────────────────────────────────┼─────────────────────────────────────────┘
                                         │
                                         │ External API Calls
                                         │
┌────────────────────────────────────────┼─────────────────────────────────────────┐
│                                        │                                         │
│                             External Services                                   │
│                                        │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                        OpenAI API Services                                 │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Whisper API                                         │ │ │
│  │  │  - Model: whisper-1 (Large)                                            │ │ │
│  │  │  - Audio Processing & Transcription                                    │ │ │
│  │  │  - Response: Text transcript                                           │ │ │
│  │  │  - Rate Limiting & Error Handling                                      │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    GPT-4 API                                            │ │ │
│  │  │  - Model: gpt-4-1106-preview                                            │ │ │
│  │  │  - Grammar correction & text processing                                 │ │ │
│  │  │  - JSON response format                                                 │ │ │
│  │  │  - Custom prompts support                                               │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                        Firebase Services                                   │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Firebase Auth                                        │ │ │
│  │  │  - Google OAuth 2.0 integration                                        │ │ │
│  │  │  - User session management                                              │ │ │
│  │  │  - Token validation                                                     │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    Firebase Firestore                                  │ │ │
│  │  │                                                                         │ │ │
│  │  │  Collection: "Customers"                                                │ │ │
│  │  │  Document ID: {user_uid}                                                │ │ │
│  │  │                                                                         │ │ │
│  │  │  Document Structure:                                                    │ │ │
│  │  │  {                                                                      │ │ │
│  │  │    "prompt": "Custom grammar prompt",                                   │ │ │
│  │  │    "corrected_words": {                                                 │ │ │
│  │  │      "original": "correction"                                           │ │ │
│  │  │    },                                                                   │ │ │
│  │  │    "discarded_fuzzy": {                                                 │ │ │
│  │  │      "word": "ignored_suggestion"                                       │ │ │
│  │  │    }                                                                    │ │ │
│  │  │  }                                                                      │ │ │
│  │  │                                                                         │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Complete Data Flow: Record → Transcribe → Correct → Store

### Phase 1: Recording Initiation
```
User Click "Start Recording"
          │
          ▼
┌─────────────────────────┐
│   handleToggleRecording │
│   (VoiceRecorder.tsx)   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│    startRecording()     │
│  (useVoiceRecorder.ts)  │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ navigator.mediaDevices  │
│   .getUserMedia()       │
│   - Request mic access  │
│   - Create audio stream │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   MediaRecorder API     │
│   - Create recorder     │
│   - Set event handlers  │
│   - Start recording     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   State Update          │
│   recordingState =      │
│   'recording'           │
└─────────────────────────┘
```

### Phase 2: Recording Process
```
Audio Input (Microphone)
          │
          ▼
┌─────────────────────────┐
│   MediaRecorder         │
│   - Capture audio       │
│   - Create data chunks  │
│   - ondataavailable     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Audio Chunks Array    │
│   audioChunksRef.current│
│   - Store blob chunks   │
└─────────────────────────┘
```

### Phase 3: Recording Stop & Processing
```
User Click "Stop Recording"
          │
          ▼
┌─────────────────────────┐
│    stopRecording()      │
│  - Set state to         │
│    'processing'         │
│  - Call recorder.stop() │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   mediaRecorder.onstop  │
│   - Combine audio chunks│
│   - Create final blob   │
│   - Set audioBlob state │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Audio Blob Created     │
│  - Type: audio/webm     │
│  - Size: ~35KB          │
│  - Codecs: opus         │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Auto-trigger            │
│ transcribeAudioBlob()   │
└─────────────────────────┘
```

### Phase 4: Transcription API Call
```
transcribeAudioBlob(blob)
          │
          ▼
┌─────────────────────────┐
│   State Update          │
│   recordingState =      │
│   'transcribing'        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   FormData Creation     │
│   - Append audio blob   │
│   - Set filename        │
│   - Set content type    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   HTTP POST Request     │
│   fetch('/api/transcribe│
│   - Method: POST        │
│   - Body: FormData      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Server API Handler    │
│   (/api/transcribe)     │
│   - Validate file       │
│   - Check API key       │
│   - Initialize OpenAI   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   OpenAI API Call       │
│   openai.audio          │
│   .transcriptions       │
│   .create()             │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Whisper Processing    │
│   - Model: whisper-1    │
│   - Audio → Text        │
│   - Return transcript   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   API Response          │
│   {                     │
│     success: true,      │
│     transcript: "text", │
│     duration: 3705      │
│   }                     │
└─────────────────────────┘
```

### Phase 5: UI Update & Display
```
API Response Received
          │
          ▼
┌─────────────────────────┐
│   Response Processing   │
│   - Check success       │
│   - Extract transcript  │
│   - Handle errors       │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   State Updates         │
│   - transcript = text   │
│   - recordingState =    │
│     'idle'              │
│   - error = null        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   React Re-render       │
│   - Hide loading states │
│   - Show transcript box │
│   - Enable copy button  │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   TranscriptDisplay     │
│   - Render words        │
│   - Apply fuzzy matches │
│   - Add click handlers  │
└─────────────────────────┘
```

### Phase 6: Word Correction Flow
```
User Clicks on Word
          │
          ▼
┌─────────────────────────┐
│   ClickableWord.tsx     │
│   - Show suggestions    │
│   - Load user data      │
│   - Display input field │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   User Data Context    │
│   - Fetch corrections  │
│   - Check fuzzy matches │
│   - Load user prompt    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Correction Applied    │
│   - Update transcript   │
│   - Save to Firebase    │
│   - Store in context    │
└─────────────────────────┘
```

### Phase 7: Grammar Correction Flow
```
User Clicks "Correct Grammar"
          │
          ▼
┌─────────────────────────┐
│   POST /api/grammar/    │
│   correct               │
│   - Send transcript     │
│   - Include user data   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Grammar Service       │
│   - Apply user prompts  │
│   - Process with GPT-4  │
│   - Apply transformations│
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Corrected Text        │
│   - Update UI           │
│   - Show fuzzy matches  │
│   - Enable word editing │
└─────────────────────────┘
```

### Phase 8: User Data Persistence
```
User Makes Correction
          │
          ▼
┌─────────────────────────┐
│   User Data API         │
│   - POST transformations│
│   - POST discarded-fuzzy│
│   - PUT custom prompt   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Firebase Firestore    │
│   - Update user document│
│   - Store in "Customers"│
│   - Use dot notation    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Context State Update  │
│   - Refresh user data   │
│   - Update local state  │
│   - Enable auto-apply   │
└─────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    page.tsx     │    │ VoiceRecorder   │    │useVoiceRecorder │
│                 │    │     .tsx        │    │     .ts         │
│  - App Layout   │───▶│                 │───▶│                 │
│  - Component    │    │  - UI Layer     │    │  - Logic Layer  │
│    Container    │    │  - Event        │    │  - State Mgmt   │
│                 │    │    Handlers     │    │  - API Calls    │
│                 │    │  - Display      │    │  - MediaRecorder│
└─────────────────┘    │    Logic        │    │    Integration  │
                       │                 │    │                 │
                       └─────────┬───────┘    └─────────────────┘
                                 │                       │
                                 │                       │
                                 ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │TranscriptDisplay│    │   Next.js API   │
                       │     .tsx        │    │     Routes      │
                       │                 │    │                 │
                       │  - Word Parsing │    │  - Serverless   │
                       │  - Click Events │    │    Functions    │
                       │  - Fuzzy Match  │    │  - OpenAI SDK   │
                       │    Display      │    │  - Firebase SDK │
                       └─────────┬───────┘    └─────────────────┘
                                 │                       │
                                 │                       │
                                 ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ ClickableWord   │    │   Browser APIs  │
                       │     .tsx        │    │                 │
                       │                 │    │  - MediaRecorder│
                       │  - Suggestions  │    │  - Clipboard    │
                       │  - Input Field  │    │  - Audio Stream │
                       │  - Save Actions │    │                 │
                       └─────────┬───────┘    └─────────────────┘
                                 │
                                 │
                                 ▼
                       ┌─────────────────┐
                       │   Settings.tsx  │
                       │                 │
                       │  - User Prefs   │
                       │  - Word Mgmt    │
                       │  - Grammar      │
                       │    Prompts      │
                       └─────────────────┘
```

### Context Provider Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Context Layer                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐              ┌─────────────────────┐                   │
│  │   AuthContext       │              │ UserDataContext     │                   │
│  │                     │              │                     │                   │
│  │  - User State       │◄─────────────┤  - Word Corrections │                   │
│  │  - Sign In/Out      │              │  - Grammar Prompts  │                   │
│  │  - Session Mgmt     │              │  - Fuzzy Matches    │                   │
│  │                     │              │  - Firebase Sync    │                   │
│  └─────────────────────┘              └─────────────────────┘                   │
│             │                                     │                             │
│             │                                     │                             │
│             ▼                                     ▼                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          All Components                                     │ │
│  │                                                                             │ │
│  │  VoiceRecorder → TranscriptDisplay → ClickableWord → Settings              │ │
│  │       │                │                  │              │                 │ │
│  │       │                │                  │              │                 │ │
│  │       └────────────────┼──────────────────┼──────────────┘                 │ │
│  │                        │                  │                                │ │
│  │                        └──────────────────┘                                │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Recording States
```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────┐
│  idle   │───▶│  recording  │───▶│ processing  │───▶│transcribing  │───▶│  idle   │
└─────────┘    └─────────────┘    └─────────────┘    └──────────────┘    └─────────┘
     ▲                                                                         │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
```

### Grammar Correction States
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│ transcript  │───▶│   correcting    │───▶│   corrected     │───▶│ user_edit   │
│  received   │    │   grammar       │    │   grammar       │    │  mode       │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
     ▲                                                                  │
     │                                                                  │
     └──────────────────────────────────────────────────────────────────┘
```

### User Data States
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   loading   │───▶│     loaded      │───▶│    updating     │───▶│   synced    │
│ user_data   │    │   user_data     │    │   user_data     │    │ user_data   │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
     ▲                                                                  │
     │                                                                  │
     └──────────────────────────────────────────────────────────────────┘
```

### Authentication States
```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│ unauthenticated │───▶│   signing_in    │───▶│  authenticated  │───▶│ signing_out │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
     ▲                                                                  │
     │                                                                  │
     └──────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Sources:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Microphone     │    │   API Route     │    │   OpenAI API    │    │   Firebase      │
│  Permission     │    │   Validation    │    │   Errors        │    │   Errors        │
│  - Denied       │    │   - File type   │    │   - Rate limit  │    │   - Auth failed │
│  - Not found    │    │   - File size   │    │   - Quota       │    │   - Network     │
│  - Hardware     │    │   - API key     │    │   - Timeout     │    │   - Permissions │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          ▼                      ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Error State Management                                   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Error Handling Strategy                                │ │
│  │                                                                                 │ │
│  │  1. Transcription Errors:                                                      │ │
│  │     - Set error message in state                                               │ │
│  │     - Reset recordingState to 'idle'                                          │ │
│  │     - Display error to user                                                   │ │
│  │     - Log error for debugging                                                 │ │
│  │                                                                                 │ │
│  │  2. Grammar Correction Errors:                                                 │ │
│  │     - Fallback to original transcript                                          │ │
│  │     - Show warning message                                                     │ │
│  │     - Continue with word correction features                                   │ │
│  │                                                                                 │ │
│  │  3. User Data Errors:                                                          │ │
│  │     - Retry with exponential backoff                                           │ │
│  │     - Cache failed updates locally                                             │ │
│  │     - Show offline mode indicator                                              │ │
│  │                                                                                 │ │
│  │  4. Authentication Errors:                                                     │ │
│  │     - Redirect to sign-in page                                                 │ │
│  │     - Clear local storage                                                      │ │
│  │     - Show authentication error message                                        │ │
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema
```
Firebase Firestore Collection: "Customers"
Document Structure:
{
  "prompt": "string",                    // Custom grammar correction prompt
  "corrected_words": {                   // User word corrections dictionary
    "original_word": "corrected_word",
    "another_word": "its_correction"
  },
  "discarded_fuzzy": {                   // Rejected fuzzy match suggestions
    "word": "rejected_suggestion",
    "word2": "rejected_suggestion2"
  }
}

Security Rules:
- Users can only access their own document (document ID = user UID)
- Read/write permissions require authentication
- No cross-user data access allowed
```

This comprehensive architecture provides a robust foundation for voice transcription with intelligent text processing, user customization, and scalable data management. The system handles multiple error scenarios gracefully while maintaining a smooth user experience through proper state management and context-based data flow.