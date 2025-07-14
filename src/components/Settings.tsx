'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// Removed direct service imports - now using API endpoints

export default function Settings() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<string>('The following is a voice-to-text transcription. Please clean it up for grammar and clarity. Respond back with just the cleaned-up text.');
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [savedPrompt, setSavedPrompt] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  
  const [transformations, setTransformations] = useState<Record<string, string>>({});
  const [transformationsLoading, setTransformationsLoading] = useState<boolean>(false);

  // Load user's saved prompt and transformations on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setPromptLoading(true);
        setTransformationsLoading(true);
        
        try {
          const [promptResponse, transformationsResponse] = await Promise.all([
            fetch(`/api/user/prompt?uid=${user.uid}`),
            fetch(`/api/user/transformations?uid=${user.uid}`)
          ]);

          if (!promptResponse.ok || !transformationsResponse.ok) {
            throw new Error('Failed to fetch user data');
          }

          const promptData = await promptResponse.json();
          const transformationsData = await transformationsResponse.json();
          
          setPrompt(promptData.prompt);
          setSavedPrompt(promptData.prompt);
          setTransformations(transformationsData.transformations);
          setHasChanges(false);
          setJustSaved(false);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setPromptLoading(false);
          setTransformationsLoading(false);
        }
      }
    };
    
    loadUserData();
  }, [user]);
  
  // Check if current prompt has changes
  useEffect(() => {
    if (savedPrompt) { // Only check after initial load
      setHasChanges(prompt !== savedPrompt);
      if (prompt !== savedPrompt) {
        setJustSaved(false); // Clear saved state when user makes changes
      }
    }
  }, [prompt, savedPrompt]);
  
  const handleSavePrompt = async () => {
    if (!user) return;
    
    setPromptLoading(true);
    try {
      const response = await fetch('/api/user/prompt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save prompt');
      }

      setSavedPrompt(prompt);
      setHasChanges(false);
      setJustSaved(true);
      console.log('Prompt saved successfully');
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setPromptLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Customize your transcription experience</p>
      </div>

      <div className="space-y-8">
        {/* Transcription Prompt Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Transcription Prompt</h2>
          <p className="text-gray-600 mb-4">
            This prompt guides how your voice recordings are transcribed and cleaned up.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Default Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={promptLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
                rows={4}
                placeholder="Enter a prompt to guide the transcription..."
              />
              {hasChanges && (
                <p className="text-xs text-amber-600 mt-1">
                  You have unsaved changes to your prompt
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSavePrompt}
                disabled={!hasChanges || promptLoading}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${justSaved 
                    ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                    : hasChanges 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                  ${promptLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {promptLoading ? 'Saving...' : justSaved ? '✓ Saved' : 'Save Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Word Corrections Section - View Only */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Word Corrections</h2>
          <p className="text-gray-600 mb-4">
            Your current word corrections that are automatically applied to transcriptions.
          </p>
          
          <div>
            {transformationsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading corrections...</p>
              </div>
            ) : Object.keys(transformations).length === 0 ? (
              <p className="text-gray-500 text-sm italic">No word corrections configured yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(transformations).map(([incorrect, correct]) => (
                  <div key={incorrect} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">{incorrect}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{correct}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}