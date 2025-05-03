'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error parameters in the URL
    const errorCode = searchParams.get('error');
    const errorMessage = searchParams.get('error_description');

    if (errorCode) {
      let displayError = 'An error occurred during authentication.';
      
      if (errorMessage) {
        // Clean up the error message for display
        displayError = decodeURIComponent(errorMessage)
          .replace(/\+/g, ' ')
          .replace(/\.$/, '');
      } else {
        // Map common error codes to user-friendly messages
        switch (errorCode) {
          case 'access_denied':
            displayError = 'Access was denied. You may have cancelled the login.';
            break;
          case 'invalid_request':
            displayError = 'Invalid authentication request.';
            break;
          case 'invalid_client':
            displayError = 'Client authentication failed.';
            break;
          case 'unauthorized_client':
            displayError = 'Your account is not authorized to access this application.';
            break;
          case 'server_error':
            displayError = 'Server error during authentication. Please try again later.';
            break;
          default:
            displayError = `Authentication error: ${errorCode}`;
        }
      }
      
      setError(displayError);
    }
  }, [searchParams]);

  if (!error) {
    return null;
  }

  return (
    <div className="w-full max-w-md mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-center">
      <p className="text-red-600">{error}</p>
    </div>
  );
} 