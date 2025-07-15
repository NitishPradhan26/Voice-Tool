'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';

export default function Settings() {
  const { user } = useAuth();
  const { userData, updatePrompt } = useUserData();
  const [localPrompt, setLocalPrompt] = useState<string>('')
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Load user's saved prompt from context
  useEffect(() => {
    if (userData.prompt !== undefined) {
      setLocalPrompt(userData.prompt);
      setHasChanges(false);
      setJustSaved(false);
    }
  }, [userData.prompt]);
  
  // Check if current prompt has changes
  useEffect(() => {
    if (userData.prompt !== undefined) {
      setHasChanges(localPrompt !== userData.prompt);
      if (localPrompt !== userData.prompt) {
        setJustSaved(false); // Clear saved state when user makes changes
      }
    }
  }, [localPrompt, userData.prompt]);
  
  const handleSavePrompt = async () => {
    if (!user) return;
    
    setPromptLoading(true);
    try {
      await updatePrompt(localPrompt);
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
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-sm font-medium text-gray-900">{user?.displayName || 'User'}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transcription Prompt Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Transcription Prompt</h2>
          <p className="text-gray-600 mb-4">
            This prompt guides how your voice recordings are transcribed and cleaned up.
          </p>
          
          <div className="space-y-4">
            <div>
              <textarea
                id="prompt"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
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
          <p className="text-gray-600 mb-4">
            Original word → Corrected word
          </p>
          
          <div>
            {userData.isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading corrections...</p>
              </div>
            ) : Object.keys(userData.correctedWords).length === 0 ? (
              <p className="text-gray-500 text-sm italic">No word corrections configured yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(userData.correctedWords).map(([incorrect, correct]) => (
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