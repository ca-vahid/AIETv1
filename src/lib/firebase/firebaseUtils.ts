import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithPopup,
  OAuthProvider,
  getRedirectResult,
  signOut as firebaseSignOut,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set up Microsoft provider
const getMicrosoftProvider = () => {
  const provider = new OAuthProvider('microsoft.com');
  
  // Specify custom parameters (use tenant, no forced re-consent)
  provider.setCustomParameters({
    // Use the tenant specified in the env; fallback to common for multi-tenant
    tenant: process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common',
    prompt: 'select_account'
  });

  // Request additional scopes if needed
  // Required for basic profile info
  provider.addScope('user.read');
  // Required for detailed profile info
  provider.addScope('user.readbasic.all');
  // Additional scopes for more profile information
  provider.addScope('profile');
  
  return provider;
};

// Sign in with Microsoft (redirects user to Microsoft sign-in page)
const signInWithMicrosoft = async () => {
  try {
    // Configure auth persistence to survive redirects within session
    await setPersistence(auth, browserSessionPersistence);

    const provider = getMicrosoftProvider();

    // Prefer popup to avoid cross-domain redirect issues in local dev
    try {
      const result = await signInWithPopup(auth, provider);
      // Extract access token from credential
      const credential = OAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      // Store Microsoft access token in localStorage for Graph API calls
      if (accessToken) {
        localStorage.setItem('msAccessToken', accessToken);
      }
      
      return { user: result.user, accessToken };
    } catch (popupError: any) {
      // If popup is blocked, fall back to redirect
      if (
        popupError?.code === 'auth/popup-blocked' ||
        popupError?.code === 'auth/popup-closed-by-user'
      ) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }
  } catch (error) {
    console.error('Error starting Microsoft sign-in:', error);
    throw error;
  }
};

// Handle the redirect result after Microsoft sign in
const handleMicrosoftRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User is signed in
      const credential = OAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      // Store Microsoft access token in localStorage for Graph API calls
      if (accessToken) {
        localStorage.setItem('msAccessToken', accessToken);
      }
      
      return {
        user: result.user,
        accessToken
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error handling Microsoft redirect:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth functions
export const logoutUser = () => signOut();

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/**
 * Fetch Microsoft Graph profile data using the stored access token
 */
const fetchMicrosoftGraphProfile = async () => {
  try {
    const accessToken = localStorage.getItem('msAccessToken');
    
    if (!accessToken) {
      throw new Error('No Microsoft access token available');
    }
    
    // Request specific fields we need from the Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname,jobTitle,department,officeLocation,businessPhones,mobilePhone,preferredLanguage,mail,employeeId', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Microsoft Graph profile: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Microsoft Graph profile:', error);
    throw error;
  }
};

export {
  app,
  auth,
  db,
  storage,
  signInWithMicrosoft,
  handleMicrosoftRedirect,
  signOut,
  fetchMicrosoftGraphProfile
};
