'use client';

import React from 'react';
import { UserProfile } from '@/app/api/profile/route';
import Image from 'next/image';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import Link from 'next/link';

interface ProfileCardProps {
  onEditClick?: () => void;
}

export default function ProfileCard({ onEditClick }: ProfileCardProps) {
  const { profile, isLoading } = useSessionProfile();

  if (isLoading) {
    return (
      <div className="theme-panel rounded-lg shadow-lg p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-slate-700 h-20 w-20"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="theme-panel rounded-lg shadow-lg p-6">
        <p className="theme-text-muted">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="theme-panel rounded-lg shadow-lg overflow-hidden max-w-lg">
      {/* Slimmer header with photo and name */}
      <div className="relative bg-gradient-to-r from-slate-800 to-blue-900 p-4 h-20">
        <div className="flex justify-end items-start">
          <button 
            onClick={onEditClick}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-sm transition"
          >
            Edit
          </button>
        </div>
        
        {/* Positioned avatar that overlaps */}
        <div className="absolute left-6 -bottom-14">
          {profile.photoUrl ? (
            <img 
              src={profile.photoUrl} 
              alt={profile.name}
              className="w-28 h-28 rounded-full border-2 border-white shadow-md object-cover ring-2 ring-blue-600/20"
            />
          ) : (
            <div className="w-28 h-28 rounded-full border-2 border-white shadow-md bg-blue-900 flex items-center justify-center overflow-hidden ring-2 ring-blue-600/20">
              <span className="text-3xl font-semibold text-blue-300">
                {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Name and badges moved to body section - adjust padding for larger avatar */}
      <div className="px-6 pt-20 pb-4 border-t border-slate-700">
        <div className="text-white mb-4">
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.jobTitle && (
              <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {profile.jobTitle}
              </span>
            )}
            {profile.department && (
              <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {profile.department}
              </span>
            )}
          </div>
        </div>

        {/* Profile details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {profile.email && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Email</p>
                <p className="text-sm font-medium theme-text-light break-all">{profile.email}</p>
              </div>
            </div>
          )}
          
          {profile.businessPhone && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Business Phone</p>
                <p className="text-sm font-medium theme-text-light break-all">{profile.businessPhone}</p>
              </div>
            </div>
          )}
          
          {profile.mobilePhone && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Mobile Phone</p>
                <p className="text-sm font-medium theme-text-light">{profile.mobilePhone}</p>
              </div>
            </div>
          )}
          
          {profile.officeLocation && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Office</p>
                <p className="text-sm font-medium theme-text-light">{profile.officeLocation}</p>
              </div>
            </div>
          )}
          
          {(profile.city || profile.state || profile.country) && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Location</p>
                <p className="text-sm font-medium theme-text-light">
                  {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional info accordion (optional) */}
      {(profile.aboutMe || profile.skills || profile.interests) && (
        <div className="px-6 pb-6 border-t border-slate-700 space-y-4">
          {profile.aboutMe && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">About Me</h3>
              <p className="text-sm theme-text-muted">{profile.aboutMe}</p>
            </div>
          )}
          
          {profile.skills && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Skills</h3>
              <p className="text-sm theme-text-muted">{profile.skills}</p>
            </div>
          )}
          
          {profile.interests && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Interests</h3>
              <p className="text-sm theme-text-muted">{profile.interests}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer - refresh data button */}
      <div className="px-6 py-3 bg-inherit border-t border-slate-700">
        <div className="flex justify-between items-center">
          <Link 
            href="/chat"
            className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Start Chat
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center text-sm text-slate-400 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh Profile
          </button>
        </div>
      </div>
    </div>
  );
} 