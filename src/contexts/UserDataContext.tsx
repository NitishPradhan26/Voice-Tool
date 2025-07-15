'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FuzzyMatchMap } from '@/utils/textTransformations';

interface UserData {
  prompt: string;
  correctedWords: Record<string, string>;
  discardedFuzzy: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

interface UserDataContextType {
  userData: UserData;
  updatePrompt: (prompt: string) => Promise<void>;
  addCorrection: (word: string, correction: string) => Promise<void>;
  addDiscardedFuzzy: (word: string, match: string) => Promise<void>;
  refetchUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    prompt: '',
    correctedWords: {},
    discardedFuzzy: {},
    isLoading: false,
    error: null,
  });

  // Fetch all user data
  const fetchUserData = async () => {
    if (!user) {
      setUserData({
        prompt: '',
        correctedWords: {},
        discardedFuzzy: {},
        isLoading: false,
        error: null,
      });
      return;
    }

    setUserData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch all user data in parallel
      const [promptResponse, transformationsResponse, discardedFuzzyResponse] = await Promise.all([
        fetch(`/api/user/prompt?uid=${user.uid}`),
        fetch(`/api/user/transformations?uid=${user.uid}`),
        fetch(`/api/user/discarded-fuzzy?uid=${user.uid}`)
      ]);

      if (!promptResponse.ok || !transformationsResponse.ok || !discardedFuzzyResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const [promptData, transformationsData, discardedFuzzyData] = await Promise.all([
        promptResponse.json(),
        transformationsResponse.json(),
        discardedFuzzyResponse.json()
      ]);

      setUserData({
        prompt: promptData.prompt || '',
        correctedWords: transformationsData.transformations || {},
        discardedFuzzy: discardedFuzzyData.discardedFuzzy || {},
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      }));
    }
  };

  // Load user data when user changes
  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Update prompt
  const updatePrompt = async (newPrompt: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, prompt: newPrompt })
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      // Optimistically update local state
      setUserData(prev => ({ ...prev, prompt: newPrompt }));
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  };

  // Add word correction
  const addCorrection = async (word: string, correction: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/transformations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          transformations: { [word]: correction }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add correction');
      }

      // Optimistically update local state
      setUserData(prev => ({
        ...prev,
        correctedWords: { ...prev.correctedWords, [word]: correction }
      }));
    } catch (error) {
      console.error('Error adding correction:', error);
      throw error;
    }
  };

  // Add discarded fuzzy match
  const addDiscardedFuzzy = async (word: string, match: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/discarded-fuzzy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          discardedFuzzy: { [word]: match }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add discarded fuzzy match');
      }

      // Optimistically update local state
      setUserData(prev => ({
        ...prev,
        discardedFuzzy: { ...prev.discardedFuzzy, [word]: match }
      }));
    } catch (error) {
      console.error('Error adding discarded fuzzy match:', error);
      throw error;
    }
  };

  // Refetch user data
  const refetchUserData = async () => {
    await fetchUserData();
  };

  const contextValue: UserDataContextType = {
    userData,
    updatePrompt,
    addCorrection,
    addDiscardedFuzzy,
    refetchUserData,
  };

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
}

// Custom hook to use user data context
export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}