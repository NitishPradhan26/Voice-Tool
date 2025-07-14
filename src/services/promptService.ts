import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_PROMPT = 'The following is a voice-to-text transcription. Please clean it up for grammar and clarity. Respond back with just the cleaned-up text.';

export interface UserPrompt {
  id: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user's saved prompt from Firestore
 * @param uid - User's UID
 * @returns Promise<string> - User's prompt or default prompt
 */
export async function getUserPrompt(uid: string): Promise<string> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      
      // Check if prompt field exists
      if (userData.prompt) {
        return userData.prompt;
      } else {
        // Document exists but no prompt field - create default prompt
        await createDefaultPrompt(uid);
        return DEFAULT_PROMPT;
      }
    }
    
    // If no document exists, create default prompt for user
    await createDefaultPrompt(uid);
    return DEFAULT_PROMPT;
  } catch (error) {
    console.error('Error getting user prompt:', error);
    return DEFAULT_PROMPT;
  }
}

/**
 * Create default prompt for new user
 * @param uid - User's UID
 * @returns Promise<void>
 */
export async function createDefaultPrompt(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    await setDoc(userDocRef, {
      prompt: DEFAULT_PROMPT
    });
    
    console.log('Default prompt created for user:', uid);
  } catch (error) {
    console.error('Error creating default prompt:', error);
    throw error;
  }
}

/**
 * Update user's prompt in Firestore
 * @param uid - User's UID
 * @param newPrompt - New prompt text
 * @returns Promise<void>
 */
export async function updateUserPrompt(uid: string, newPrompt: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    
    // Update the user document with new prompt
    await updateDoc(userDocRef, {
      prompt: newPrompt,
    });
    console.log('Prompt updated successfully for user:', uid);
  } catch (error) {
    console.error('Error updating user prompt:', error);
    throw error;
  }
}
