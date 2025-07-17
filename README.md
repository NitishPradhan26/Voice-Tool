# Voice Transcription Tool

A powerful web application that converts speech to text using OpenAI's Whisper model with intelligent grammar correction, user-customizable word transformations, and fuzzy matching capabilities.

## ✨ Features

### 🎙️ **Voice Recording & Transcription**
- Real-time voice recording with visual waveform animation
- High-accuracy transcription powered by OpenAI Whisper
- Support for multiple audio formats (webm, wav, mp3, m4a, ogg)
- File size limit of 4.5MB per audio recording

### 🧠 **Intelligent Text Processing**
- **Grammar Correction**: Automatic grammar and spelling fixes using OpenAI GPT-4
- **Smart Word Suggestions**: Click on any word to see correction suggestions
- **Fuzzy Matching**: Intelligent word matching with customizable vocabulary
- **User Transformations**: Persistent word corrections that learn from your preferences

### 🔧 **User Customization**
- **Personal Dictionary**: Save custom word corrections
- **Discarded Fuzzy Matches**: Exclude unwanted auto-corrections
- **Custom Grammar Prompts**: Personalize grammar correction behavior
- **Settings Management**: Persistent user preferences with Firebase

### 🔐 **Authentication & Data**
- Google Sign-In integration with Firebase Auth
- Secure user data storage with Firestore
- User-specific transformations and preferences
- Real-time data synchronization

### 🎨 **User Interface**
- Clean, responsive design with Tailwind CSS
- Mobile-friendly popup positioning
- Visual feedback for recording status
- Copy-to-clipboard functionality
- Interactive word correction interface

## 🛠️ Tech Stack

- **Frontend**: React 19 + Next.js 15 (TypeScript)
- **Backend**: Next.js API routes (serverless functions)
- **AI/ML**: OpenAI Whisper + GPT-4 for transcription and grammar correction
- **Authentication**: Firebase Auth with Google Sign-In
- **Database**: Firestore for user data and preferences
- **Styling**: Tailwind CSS v4
- **Testing**: Jest with comprehensive unit and integration tests
- **Text Processing**: Fuse.js for fuzzy string matching
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Firebase project (for authentication and data storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following:
   ```bash
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### OpenAI Setup

1. **Get API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account or sign in
   - Generate a new API key
   - Add it to your `.env.local` file

2. **Models Used**
   - **Whisper-1**: For speech-to-text transcription
   - **GPT-4-1106-preview**: For grammar correction and text processing

3. **Cost Considerations**
   - **Whisper**: $0.006 per minute of audio
   - **GPT-4**: ~$0.01-0.03 per request depending on text length

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and Firestore Database

2. **Configure Authentication**
   - Enable Google Sign-In provider
   - Add your domain to authorized domains

3. **Set up Firestore**
   - Create database in production mode
   - Configure security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /Customers/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Database Schema Design**
   
   The application uses a simple, user-centric data model:
   
   ```
   Collection: "Customers"
   Document ID: {user_uid}
   
   Document Structure:
   {
     "prompt": "Custom grammar correction prompt (string)",
     "corrected_words": {
       "original_word": "corrected_word",
       "another_word": "its_correction"
     },
     "discarded_fuzzy": {
       "word1": "ignored_suggestion1",
       "word2": "ignored_suggestion2"
     }
   }
   ```
   
   **Schema Details:**
   - **Collection Name**: `Customers` (contains all user data)
   - **Document ID**: Firebase Auth UID (ensures user-specific access)
   - **prompt**: String - Custom grammar correction instructions
   - **corrected_words**: Object - User's word correction dictionary
   - **discarded_fuzzy**: Object - Fuzzy matches the user has rejected
   
   **Data Access Pattern:**
   - Each user has exactly one document
   - All user data is stored in a single document for efficiency
   - Real-time updates using Firestore's `updateDoc()` with dot notation
   - No subcollections used - flat structure for simplicity

## 📖 Usage

### Recording and Transcription

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Record Audio**: Click the microphone button and speak clearly
3. **Stop Recording**: Click "Stop Recording" when finished
4. **View Results**: The transcript appears with word count and duration

### Word Correction Features

1. **Click Any Word**: Click on any word in the transcript to see suggestions
2. **Accept Suggestions**: Click on suggested words to apply corrections
3. **Custom Corrections**: Type your own corrections in the input field
4. **Fuzzy Matches**: Yellow-highlighted words show automatic fuzzy matches
5. **Manage Corrections**: View and manage your word corrections in Settings

### Smart Features

- **Auto-Learning**: Your corrections are automatically saved and applied to future transcripts
- **Fuzzy Matching**: The system suggests corrections for misspelled words
- **Grammar Correction**: Automatic grammar and punctuation fixes
- **Custom Prompts**: Personalize how grammar correction works in Settings

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── transcribe/              # Whisper transcription endpoint
│   │   ├── grammar/correct/         # Grammar correction endpoint
│   │   ├── suggest/                 # Word suggestions endpoint
│   │   └── user/                    # User data management endpoints
│   ├── page.tsx                     # Main application page
│   └── layout.tsx                   # App layout with Firebase providers
├── components/
│   ├── VoiceRecorder.tsx           # Main recording interface
│   ├── TranscriptDisplay.tsx       # Transcript rendering and word interaction
│   ├── ClickableWord.tsx           # Interactive word correction component
│   ├── FuzzyMatchWord.tsx          # Fuzzy match display component
│   ├── Settings.tsx                # User preferences management
│   ├── GoogleSignIn.tsx            # Authentication component
│   └── WaveformAnimation.tsx       # Recording visual feedback
├── services/
│   ├── transcriptionService.ts     # Audio transcription logic
│   ├── grammarService.ts           # Grammar correction and text processing
│   └── userDataService.ts          # User data management
├── contexts/
│   ├── AuthContext.tsx             # Firebase authentication context
│   └── UserDataContext.tsx         # User data management context
├── hooks/
│   └── useVoiceRecorder.ts         # Audio recording and processing hook
├── utils/
│   └── textTransformations.ts     # Text processing utilities
├── data/
│   └── vocab.json                  # Vocabulary database for fuzzy matching
└── lib/
    ├── firebase.ts                 # Firebase configuration
    └── openAI.ts                   # OpenAI client setup
```

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and service integration testing
- **Mocking**: Complete OpenAI and Firebase mocking for reliable tests

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Configure Environment Variables**
   In Vercel Dashboard, add all environment variables from your `.env.local`

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Environment Variables for Production

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🔍 API Endpoints

### Transcription
- `POST /api/transcribe` - Convert audio to text using Whisper

### Grammar Correction
- `POST /api/grammar/correct` - Correct grammar and apply user transformations

### Word Suggestions
- `GET /api/suggest` - Get word suggestions for corrections

### User Data Management
- `POST /api/user/transformations` - Save user word corrections
- `POST /api/user/discarded-fuzzy` - Save discarded fuzzy matches
- `POST /api/user/prompt` - Save custom grammar prompts

## 🛡️ Security

- **Authentication**: Firebase Auth with Google Sign-In
- **Data Protection**: User-specific data access with Firestore security rules
- **API Security**: Server-side API key management
- **Input Validation**: Comprehensive input sanitization and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for Whisper and GPT-4 models
- Firebase for authentication and database services
- Fuse.js for fuzzy string matching
- Tailwind CSS for styling
- Next.js team for the excellent framework

---

**Built with ❤️ for better speech-to-text experiences**