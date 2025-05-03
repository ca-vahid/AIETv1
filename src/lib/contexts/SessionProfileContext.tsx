'use client';

/**
 * SessionProfileContext - Manages and provides user profile data throughout the app
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from '@/lib/firebase/firebaseUtils';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { UserProfile } from "@/app/api/profile/route";

// Define the context type
interface SessionProfileContextType {
  profile: UserProfile | null;
  firebaseUser: User | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// Create the context with a default value
const SessionProfileContext = createContext<SessionProfileContextType>({
  profile: null,
  firebaseUser: null,
  updateProfile: async () => {},
  isLoading: true,
  error: null,
});

/**
 * SessionProfileProvider - Provides user profile context to the app
 */
export function SessionProfileProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] onAuthStateChanged fired. User:', user);
      setFirebaseUser(user);
      
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Get the ID token for the current user
        const idToken = await getIdToken(user);
        console.log('[Auth] Got ID token:', idToken);
        
        // Fetch user profile from your API with the token
        console.log('[Auth] Fetching /api/profile with token...');
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        console.log('[Auth] /api/profile response status:', response.status);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        
        const data = await response.json();
        console.log('[Auth] Profile data received:', data);
        setProfile(data);
      } catch (err) {
        console.error('[Auth] Error fetching profile:', err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Update specific fields in the user's profile
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) {
      throw new Error("Not authenticated");
    }

    try {
      // Get the ID token for the current user
      const idToken = await getIdToken(firebaseUser);
      console.log('[Auth] Updating profile with:', updates);
      
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify(updates),
      });
      console.log('[Auth] Profile update response status:', response.status);
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      console.log('[Auth] Updated profile data:', updatedProfile);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('[Auth] Error updating profile:', err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  };

  return (
    <SessionProfileContext.Provider
      value={{
        profile,
        firebaseUser,
        updateProfile,
        isLoading,
        error,
      }}
    >
      {children}
    </SessionProfileContext.Provider>
  );
}

/**
 * useSessionProfile - Hook to easily access user profile data and update functions
 */
export function useSessionProfile() {
  const context = useContext(SessionProfileContext);
  if (!context) {
    throw new Error("useSessionProfile must be used within a SessionProfileProvider");
  }
  return context;
} 