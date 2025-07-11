import VoiceRecorder from "@/components/VoiceRecorder";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Voice Transcription Tool
          </h1>
          <p className="text-xl text-gray-600">
            Speak naturally, get clean text instantly
          </p>
        </header>

        <main className="bg-white rounded-lg shadow-lg p-8">
          <VoiceRecorder />
        </main>
      </div>
    </div>
  );
}
