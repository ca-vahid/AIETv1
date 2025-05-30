'use client';

import React from 'react';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import Link from 'next/link';

interface ProfileCardProps {
  onEditClick?: () => void;
  compact?: boolean;
}

export default function ProfileCard({ onEditClick, compact = false }: ProfileCardProps) {
  const { profile, isLoading } = useSessionProfile();

  if (isLoading) {
    return (
      <div className="bgc-panel rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-[#0066cc]/20 h-20 w-20"></div>
          <div className="flex-1">
            <div className="h-4 bg-[#0066cc]/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[#0066cc]/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bgc-panel rounded-2xl shadow-xl p-6">
        <p className="text-slate-800 dark:text-slate-300 font-medium">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bgc-panel rounded-2xl shadow-xl overflow-hidden relative">
      {/* BGC-themed background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#0066cc]/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#004080]/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0066cc]/3 rounded-full blur-lg"></div>
      </div>

      {/* Header section */}
      <div className="relative p-6 text-center">
        {/* Avatar with BGC styling */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0066cc]/20 to-[#004080]/20 blur-lg animate-geologicalPulse"></div>
          
          {profile.photoUrl ? (
            <img 
              src={profile.photoUrl} 
              alt={profile.name}
              className="relative w-24 h-24 rounded-full border-4 border-[#0066cc]/30 shadow-2xl object-cover ring-4 ring-[#0066cc]/20"
            />
          ) : (
            <div className="relative w-24 h-24 rounded-full border-4 border-[#0066cc]/30 shadow-2xl bg-gradient-to-br from-[#0066cc] to-[#004080] flex items-center justify-center ring-4 ring-[#0066cc]/20">
              <span className="text-2xl font-bold text-white">
                {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Online status indicator with BGC colors */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-[#0a1628] shadow-lg">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>

        {/* Name with BGC gradient */}
        <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">
          {profile.name}
        </h1>

        {/* Role badges with BGC theme */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {profile.jobTitle && (
            <span className="inline-flex items-center text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#0066cc]/20 to-[#004080]/20 border border-[#0066cc]/40 text-[#0066cc] dark:text-[#3399ff] shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {profile.jobTitle}
            </span>
          )}
          {profile.department && (
            <span className="inline-flex items-center text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-[#d97706]/20 to-[#ea580c]/20 border border-[#d97706]/40 text-[#d97706] dark:text-[#fbbf24] shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
              {profile.department}
            </span>
          )}
        </div>

        {/* Location info with BGC styling */}
        {profile.officeLocation && (
          <div className="flex items-center justify-center text-slate-800 dark:text-slate-300 mb-6">
            <svg className="w-5 h-5 mr-2 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{profile.officeLocation}</span>
            {(profile.city || profile.country) && (
              <span className="text-slate-700 dark:text-slate-400 ml-1">
                • {[profile.city, profile.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Stats section with BGC theme */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0066cc] dark:text-[#3399ff]">12</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">Ideas Submitted</div>
          </div>
          <div className="text-center border-x border-[#0066cc]/20">
            <div className="text-2xl font-bold text-[#8b5cf6] dark:text-[#a78bfa]">8</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#10b981] dark:text-[#34d399]">4</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">Completed</div>
          </div>
        </div>

        {/* About section */}
        {profile.aboutMe && (
          <div className="text-center mb-6">
            <p className="text-sm text-slate-800 dark:text-slate-300 italic">"{profile.aboutMe}"</p>
          </div>
        )}

        {/* Skills tags with BGC theme */}
        {profile.skills && typeof profile.skills === 'string' && profile.skills.trim() && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3">Expertise</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {profile.skills.split(',').slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#0066cc]/20 dark:text-[#3399ff] rounded-full border border-[#0066cc]/30"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 