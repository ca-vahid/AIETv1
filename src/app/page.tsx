'use client';

import SignInWithAzureAD from "@/components/SignInWithAzureAD";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import AppHeader from "@/components/AppHeader";

export default function Home() {
  const { profile, isLoading } = useSessionProfile();
  const isLoggedIn = !!profile;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Use the common AppHeader component */}
      <AppHeader />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section with main CTA and profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left column: Welcome and CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simplify Your Workflow with AI Automation
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Got a task that's time-consuming, error-prone, or just plain annoying? 
              Let the AI Efficiency Team help automate it!
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isLoggedIn && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Sign in to get started</h3>
                  <p className="text-gray-600 mb-4">Use your corporate account to access all features</p>
                  <SignInWithAzureAD />
                </div>
              )}
              
              {isLoggedIn && (
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Start Chat with AI Assistant
                </Link>
              )}
            </div>
          </div>
          
          {/* Right column: Profile card */}
          <div className="lg:col-span-6 flex justify-end">
            {isLoggedIn ? (
              <ProfileCard onEditClick={() => window.location.href = "/profile/edit"} />
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100 flex flex-col items-center justify-center h-full min-h-[300px] max-w-md">
                <div className="rounded-full bg-blue-100 p-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Your Profile</h3>
                <p className="text-gray-500 text-center">Sign in to view your profile information</p>
              </div>
            )}
          </div>
        </div>
        
        {/* How It Works section (simplified) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-12 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">How It Works</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-700">1</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Sign in with Azure AD</h3>
                <p className="text-gray-600 text-sm">We'll use your existing corporate account to pre-fill your profile info.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-700">2</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Tell us about your task</h3>
                <p className="text-gray-600 text-sm">Our AI assistant will have a quick chat to understand what you need.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-700">3</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Confirm and submit</h3>
                <p className="text-gray-600 text-sm">Review the summary and we'll get back to you within one business day.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* What Can We Automate section - simplified card grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">What Can We Automate?</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Data Entry & Processing",
                  description: "Manual form filling, data extraction from documents, spreadsheet work",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  title: "Report Generation",
                  description: "Monthly reports, status updates, data visualization",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: "Document Processing",
                  description: "Contract analysis, document classification, content extraction",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Repetitive Communications",
                  description: "Email templates, status updates, notifications",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
              ].map((item, index) => (
                <div key={index} className="flex space-x-4 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 BGC Engineering - AI Efficiency Team
          </p>
        </div>
      </footer>
    </main>
  );
}
