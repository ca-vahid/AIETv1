# Setting Up Azure AD Authentication for AIET Intake App

This guide will help you set up Azure AD authentication for the AIET Intake App using Firebase Authentication.

## Prerequisites

- An Azure account with an Azure AD tenant
- A Firebase project
- Access to Firebase Authentication settings
- Administrative permissions in your Azure AD tenant

## Step 1: Set Up Your Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable the "Microsoft" authentication provider
5. Save the provider settings for now (we'll come back to it)

## Step 2: Register an App in Azure AD

1. Sign in to the [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Enter a name for your application (e.g., "AIET Intake App")
5. For "Supported account types", select the appropriate option based on your organization's requirements:
   - "Accounts in this organizational directory only" (single tenant)
   - "Accounts in any organizational directory" (multi-tenant)
   - "Accounts in any organizational directory and personal Microsoft accounts"
6. Set the Redirect URI:
   - Platform: Web
   - URL: `https://{your-firebase-project-id}.firebaseapp.com/__/auth/handler`
   - If you're using a custom domain, add that URL as well
7. Click "Register"

## Step 3: Configure the Application

1. In your new app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Enter a description and select an expiration period
4. Click "Add"
5. **IMPORTANT**: Copy the secret value immediately and save it somewhere secure, as you won't be able to see it again

## Step 4: Configure Firebase Authentication

1. Return to the Firebase Console > Authentication > Sign-in method
2. Click on the Microsoft provider
3. Enter the following:
   - Client ID: The "Application (client) ID" from your Azure app registration
   - Client Secret: The secret value you copied in Step 3
4. Configure the API permissions if needed (for accessing additional Microsoft Graph API data)
5. Save the changes

## Step 5: Set Up Firebase Admin SDK

The application needs Firebase Admin SDK credentials for server-side authentication validation. To set this up:

1. Go to the Firebase Console > Project settings > Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely (do not commit it to version control)
4. Add the following environment variables to your `.env.local` file:
   ```
   # Firebase Admin SDK
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=the-client-email-from-json-file
   FIREBASE_PRIVATE_KEY="the-private-key-from-json-file"
   ```
   Note: Make sure to keep the quotes around the private key as it contains newline characters.

## Step 6: Update Your Environment Variables

Add the following variables to your `.env.local` file:

```
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app-name.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app-name.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Azure AD configuration
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-azure-tenant-id
```

The `NEXT_PUBLIC_AZURE_AD_TENANT_ID` is your "Directory (tenant) ID" from the Azure AD app registration overview page.

## Step 7: Test the Authentication

1. Start your application
2. Click on the "Sign in with Microsoft" button
3. You should be redirected to the Microsoft sign-in page
4. After authentication, you should be redirected back to your application

## Troubleshooting

### 404 Page Not Found After Sign-In

- Verify that the Redirect URI in Azure AD matches exactly with your Firebase auth handler URL
- Check that you've added `https://{your-firebase-project-id}.firebaseapp.com/__/auth/handler` as an authorized domain

### Invalid Client ID or Secret

- Verify that you've correctly copied the Client ID and Secret from Azure
- Ensure that the Client Secret has not expired

### Tenant Issues

- If you're using a single-tenant app, make sure users are signing in with accounts from the same tenant
- For multi-tenant apps, ensure that you've set up the appropriate permissions

### Firebase Admin SDK Errors

- Make sure your service account has the correct permissions
- Check that the private key is properly formatted with newline characters preserved
- Verify that all environment variables are correctly set

## Using a Custom Redirect Domain

If you want to use a custom domain for the redirect instead of the default firebaseapp.com:

1. Set up a custom domain in Firebase Hosting
2. Add your custom domain to the authorized domains in Firebase Authentication
3. Add your custom domain redirect URI to the Azure AD app registration
4. Update your app initialization to use the custom domain

## Additional Resources

- [Firebase Authentication with Microsoft Documentation](https://firebase.google.com/docs/auth/web/microsoft-oauth)
- [Azure AD App Registration Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Authentication in Firebase](https://firebase.google.com/docs/auth/web/microsoft-oauth)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup) 