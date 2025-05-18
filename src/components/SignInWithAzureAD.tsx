'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth, signInWithMicrosoft, handleMicrosoftRedirect } from '@/lib/firebase/firebaseUtils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getIdToken } from 'firebase/auth';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function SignInWithAzureAD() {
  const [user, loading] = useAuthState(auth);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateAttempted, setProfileUpdateAttempted] = useState(false);
  const [msAccessToken, setMsAccessToken] = useState<string | null>(null);
  const { theme } = useTheme(); // Use theme context

  // Helper function to convert Blob to Base64 Data URL
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const fetchMicrosoftGraphProfile = useCallback(async (accessToken: string) => {
    try {
      console.log('Calling Microsoft Graph API...');
      const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname,jobTitle,department,officeLocation,businessPhones,mobilePhone,preferredLanguage,mail,employeeId,city,country,state,streetAddress,postalCode,userPrincipalName,skills,responsibilities,aboutMe,interests', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Microsoft Graph API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Microsoft Graph API error response:', errorText);
        throw new Error(`Failed to fetch Microsoft Graph profile: ${response.status} ${errorText}`);
      }
      
      const profileData = await response.json();
      console.log('Raw Microsoft Graph profile data:', profileData);
      
      // Try to fetch profile picture separately
      try {
        const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log('Profile photo response status:', photoResponse.status);
        
        if (photoResponse.ok) {
          const photoBlob = await photoResponse.blob();
          console.log('Photo blob received:', photoBlob.type, photoBlob.size);
          // Convert blob to Base64 data URL
          const photoDataUrl = await blobToBase64(photoBlob);
          profileData.photoUrl = photoDataUrl;
          console.log('Profile photo fetched successfully as Base64');
        } else {
          // Try alternative photo endpoint
          console.log('Trying alternative photo endpoint...');
          try {
            const altPhotoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photos/48x48/$value', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            console.log('Alt Profile photo response status:', altPhotoResponse.status);
            
            if (altPhotoResponse.ok) {
              const photoBlob = await altPhotoResponse.blob();
              // Convert blob to Base64 data URL
              const photoDataUrl = await blobToBase64(photoBlob);
              profileData.photoUrl = photoDataUrl;
              console.log('Alternative profile photo fetched successfully as Base64');
            } else {
              console.log('No profile photo available from alternative endpoint:', altPhotoResponse.status);
            }
          } catch (altPhotoError) {
            console.error('Error fetching alternative profile photo:', altPhotoError);
          }
        }
      } catch (photoError) {
        console.error('Error fetching profile photo:', photoError);
      }
      
      return profileData;
    } catch (error) {
      console.error('Error fetching Microsoft Graph profile:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const processRedirect = async () => {
      if (!user && !loading) {
        try {
          setIsProcessingRedirect(true);
          const result = await handleMicrosoftRedirect();
          if (result && result.accessToken) {
            console.log('Successfully signed in with Microsoft');
            setMsAccessToken(result.accessToken);
          }
        } catch (error) {
          console.error('Error handling redirect:', error);
          setAuthError('Failed to complete sign in. Please try again.');
        } finally {
          setIsProcessingRedirect(false);
        }
      }
    };

    processRedirect();
  }, [user, loading]);

  useEffect(() => {
    const updateUserProfile = async () => {
      if (user && msAccessToken && !isUpdatingProfile && !profileUpdateAttempted) {
        try {
          setIsUpdatingProfile(true);
          console.log('Attempting to fetch Microsoft Graph profile with token:', msAccessToken.substring(0, 20) + '...');
          
          const graphProfile = await fetchMicrosoftGraphProfile(msAccessToken);
          console.log('Microsoft Graph profile:', graphProfile);
          
          const profileUpdates = {
            jobTitle: graphProfile.jobTitle || '',
            department: graphProfile.department || '',
            officeLocation: graphProfile.officeLocation || '',
            mobilePhone: graphProfile.mobilePhone || '',
            businessPhone: graphProfile.businessPhones?.[0] || '',
            preferredLanguage: graphProfile.preferredLanguage || '',
            city: graphProfile.city || '',
            country: graphProfile.country || '',
            state: graphProfile.state || '',
            postalCode: graphProfile.postalCode || '',
            streetAddress: graphProfile.streetAddress || '',
            photoUrl: graphProfile.photoUrl || '',
            aboutMe: graphProfile.aboutMe || '',
            interests: graphProfile.interests || '',
            responsibilities: graphProfile.responsibilities || '',
            skills: graphProfile.skills || ''
          };
          console.log('Updating profile with:', profileUpdates);
          
          const idToken = await getIdToken(user);
          
          const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(profileUpdates)
          });
          
          if (!response.ok) {
            throw new Error('Failed to update profile');
          }
          
          const updatedProfile = await response.json();
          console.log('Updated user profile successfully:', updatedProfile);
        } catch (error) {
          console.error('Error updating user profile:', error);
          console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        } finally {
          setIsUpdatingProfile(false);
          setProfileUpdateAttempted(true);
        }
      } else {
        console.log('Profile update conditions not met:', {
          hasUser: !!user,
          hasAccessToken: !!msAccessToken,
          isUpdating: isUpdatingProfile,
          alreadyAttempted: profileUpdateAttempted
        });
      }
    };
    
    updateUserProfile();
  }, [user, msAccessToken, isUpdatingProfile, profileUpdateAttempted, fetchMicrosoftGraphProfile]);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const result = await signInWithMicrosoft();
      console.log('Sign-in result:', result);
      if (result && result.accessToken) {
        console.log('Got Microsoft access token:', result.accessToken.substring(0, 20) + '...');
        setMsAccessToken(result.accessToken);
      } else {
        console.log('No access token in result:', result);
      }
    } catch (error) {
      console.error('Error starting sign in:', error);
      setAuthError('Failed to start sign in. Please try again.');
    }
  };

  if (loading || isProcessingRedirect || isUpdatingProfile) {
    return (
      <button
        className="bg-gradient-to-r from-indigo-600/50 to-purple-700/50 text-white px-4 py-3 rounded-lg opacity-70 cursor-not-allowed shadow-md"
        disabled
      >
        {isUpdatingProfile ? 'Updating Profile...' : 'Loading...'}
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center text-center space-y-1">
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-bold">{user.displayName || user.email}</span>
        </p>
        <button
          onClick={async () => {
            try {
              setProfileUpdateAttempted(false); // Reset attempt flag
              const result = await signInWithMicrosoft();
              if (result && result.accessToken) {
                setMsAccessToken(result.accessToken);
                console.log("Manual refresh initiated with token:", result.accessToken.substring(0, 20) + "...");
              } else {
                console.log("No access token returned from manual sign-in");
              }
            } catch (error) {
              console.error("Error during manual refresh:", error);
              setAuthError("Failed to refresh profile data.");
            }
          }}
          className="text-xs text-blue-600 underline hover:text-blue-800 transition"
        >
          Refresh Profile Data
        </button>
        {authError && <p className="text-red-500 text-xs mt-1">{authError}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <button
        onClick={handleSignIn}
        className={`
          font-medium text-sm py-3 px-5 rounded-lg shadow-md flex items-center justify-center w-full transition-all duration-300
          ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white border border-indigo-500/30'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border border-blue-400/30'
          }
          hover:shadow-lg hover:-translate-y-0.5
        `}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          className="mr-3"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="8.4" height="8.4" fill="#f25022" />
          <rect x="10.6" y="1" width="8.4" height="8.4" fill="#7fba00" />
          <rect x="1" y="10.6" width="8.4" height="8.4" fill="#00a4ef" />
          <rect x="10.6" y="10.6" width="8.4" height="8.4" fill="#ffb900" />
        </svg>
        Sign in with BGC or Cambio
      </button>
      {authError && <p className="text-red-500 text-sm mt-2">{authError}</p>}
    </div>
  );
} 