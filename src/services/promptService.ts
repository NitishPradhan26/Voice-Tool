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
      
      // Return prompt if it exists, otherwise return default
      return userData.prompt || DEFAULT_PROMPT;
    }
    
    // User doesn't exist - initialize with default data
    await createDefaultPrompt(uid);
    return DEFAULT_PROMPT;
  } catch (error) {
    console.error('Error getting user prompt:', error);
    return DEFAULT_PROMPT;
  }
}

/**
 * Initialize user data with default values for new user
 * @param uid - User's UID
 * @returns Promise<void>
 */
export async function createDefaultPrompt(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    await setDoc(userDocRef, {
      prompt: DEFAULT_PROMPT,
      corrected_words: {} // Initialize as empty object, not null
    });
    
    console.log('User initialized with default data:', uid);
  } catch (error) {
    console.error('Error initializing user:', error);
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

/**
 * Get user's word transformation rules from Firestore
 * @param uid - User's UID
 * @returns Promise<Record<string, string>> - Object with incorrect->correct word mappings
 */
export async function getUserTransformations(uid: string): Promise<Record<string, string>> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData.corrected_words);
      return userData.corrected_words || {};
    }
    
    // User doesn't exist - initialize with default data
    await createDefaultPrompt(uid);
    return {};
  } catch (error) {
    console.error('Error getting user transformations:', error);
    return {};
  }
}

/**
 * Add user's word transformation rules to Firestore
 * @param uid - User's UID
 * @param transformations - Object with key:value pairs (incorrect->correct word mappings)
 * @returns Promise<void>
 */
export async function addUserTransformations(uid: string, transformations: Record<string, string>): Promise<void> {
  try {
    const userDocRef = doc(db, 'Customers', uid);
    
    // Build update object with dot notation for nested fields
    const updateData: Record<string, string> = {};
    
    // Add each transformation as a nested field update
    Object.entries(transformations).forEach(([originalWord, correctedWord]) => {
      updateData[`corrected_words.${originalWord}`] = correctedWord;
    });
    
    // Update the user document - this adds to existing corrected_words
    await updateDoc(userDocRef, updateData);
    console.log('Transformations added successfully for user:', uid);
  } catch (error) {
    console.error('Error adding user transformations:', error);
    throw error;
  }
}
