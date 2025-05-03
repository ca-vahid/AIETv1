'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth, signInWithMicrosoft, handleMicrosoftRedirect } from '@/lib/firebase/firebaseUtils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getIdToken } from 'firebase/auth';

export default function SignInWithAzureAD() {
  const [user, loading] = useAuthState(auth);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateAttempted, setProfileUpdateAttempted] = useState(false);
  const [msAccessToken, setMsAccessToken] = useState<string | null>(null);

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
        className="bg-blue-600 text-white px-4 py-2 rounded opacity-70 cursor-not-allowed"
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
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center shadow-sm"
      >
        <svg 
          className="w-5 h-5 mr-2" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 23 23"
          fill="currentColor"
        >
          <path d="M1 1h10v10H1V1zm0 11h10v10H1V12zm11-11h10v10H12V1zm0 11h10v10H12V12z" />
        </svg>
        Sign in with Microsoft
      </button>
      {authError && <p className="text-red-500 text-sm">{authError}</p>}
    </div>
  );
} 