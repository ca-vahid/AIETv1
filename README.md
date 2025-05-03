# AIET Intake Portal (v1.2.0)

A modern, AI-powered intake portal for BGC Engineering employees to submit automation requests. This application enables seamless communication between staff and the AI Efficiency Team (AIET) to identify and prioritize automation opportunities.

![AIET Intake Portal](https://via.placeholder.com/800x400?text=AIET+Intake+Portal)

## Features

- **Azure AD Authentication**: Seamless single sign-on with corporate Microsoft accounts
- **Profile Integration**: Auto-populates user information from Microsoft Graph API
- **Dark/Light Mode**: Theme switcher with system preference detection 
- **Modern Chat Interface**: Intuitive, streaming chat experience with the AI assistant
- **Rich Text Formatting**: Support for markdown-style formatting in chat messages
- **AI Model Selection**: Choose between standard (fast) and advanced (thinking) Gemini AI models
- **Multi-step Conversation Flow**: Guided task submission process with state management
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Authentication**: Firebase Authentication with Microsoft identity provider
- **Storage**: Firebase Firestore for conversations and user profiles
- **AI**: Google Gemini API with streaming support
- **API**: Next.js API routes with serverless functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Google AI API key (Gemini)
- Microsoft Azure AD app registration

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ca-vahid/AIETv1.git
   cd AIETv1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   
   # Firebase Admin (service account)
   FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_admin_client_email
   FIREBASE_ADMIN_PRIVATE_KEY=your_firebase_admin_private_key
   
   # Azure AD / Microsoft
   NEXT_PUBLIC_MICROSOFT_TENANT_ID=your_azure_tenant_id
   NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_azure_client_id
   
   # Google AI (Gemini)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For End Users

1. Sign in with your Microsoft corporate account
2. Click "Start Chat with AI Assistant"
3. Describe the task you'd like to automate
4. Follow the assistant's prompts to provide necessary details
5. Review the summary and submit your request

### For Administrators

1. Access the admin dashboard at `/admin` (requires admin privileges)
2. Review incoming automation requests
3. Prioritize and assign tasks to team members
4. Track progress and communicate status updates

## Deployment

This application can be deployed to Vercel with minimal configuration:

1. Connect your GitHub repository to Vercel
2. Add the environment variables from `.env.local`
3. Deploy using the Vercel dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software owned by BGC Engineering Inc.

## Changelog

### v1.2.0 (May 3, 2025)
- Added Dark/Light mode toggle with system preference detection
- Improved color schemes and contrast in both light and dark modes
- Enhanced UI styling for better readability and visual consistency
- Updated button colors and styling for better accessibility
- Improved text contrast in chat interface
- Various UI refinements and performance improvements

### v1.1.0 (May 3, 2025)
- Improved UI for better user experience
- Moved "My Requests" from header to home page
- Added request statistics and status breakdown on home page
- Enhanced chat history filtering to hide empty conversations
- Fixed index creation error handling
- Improved error handling for undefined values

### v1.0 (May 3, 2025)
- Initial release of the AIET Intake Portal
- Added Azure AD integration with Firebase Auth
- Added Microsoft Graph API integration to fetch user profiles
- Created profile card component with automatic profile photo fetching
- Implemented modern chat interface with streaming responses
- Added support for rich text formatting in chat messages
- Implemented conversation state machine for guided task submission
- Added model selection toggle between standard and advanced AI models
- Added support for Gemini API with streaming responses
- Optimized chat page layout for better screen utilization

## Contact

AI Efficiency Team - aiet@bgcengineering.ca

Project Link: [https://github.com/ca-vahid/AIETv1](https://github.com/ca-vahid/AIETv1) 