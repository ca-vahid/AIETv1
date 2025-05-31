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
        {/* Avatar with BGC styling - Much Larger */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0066cc]/20 to-[#004080]/20 blur-lg animate-geologicalPulse"></div>
          
          {profile.photoUrl ? (
            <img 
              src={profile.photoUrl} 
              alt={profile.name}
              className="relative w-32 h-32 rounded-full border-4 border-[#0066cc]/30 shadow-2xl object-cover ring-4 ring-[#0066cc]/20"
            />
          ) : (
            <div className="relative w-32 h-32 rounded-full border-4 border-[#0066cc]/30 shadow-2xl bg-gradient-to-br from-[#0066cc] to-[#004080] flex items-center justify-center ring-4 ring-[#0066cc]/20">
              <span className="text-4xl font-bold text-white">
                {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* First Name Only with BGC gradient */}
        <h1 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">
          {profile.name?.split(' ')[0] || 'Professional'}
        </h1>

        {/* Personal Description */}
        <div className="mb-4 space-y-2">
          {profile.jobTitle && (
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              {profile.jobTitle} driving innovation and efficiency
            </p>
          )}
          
          {profile.department && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Contributing to {profile.department}
            </p>
          )}
          
          {/* Location Description */}
          {(profile.officeLocation || profile.city || profile.country) && (
            <div className="flex items-center justify-center text-slate-600 dark:text-slate-400 mt-3">
              <svg className="w-4 h-4 mr-2 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                {profile.officeLocation && `Based in ${profile.officeLocation}`}
                {(profile.city || profile.country) && (
                  <>
                    {profile.officeLocation ? ', ' : 'Located in '}
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Stats section with BGC theme - More Compact */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-[#0066cc] dark:text-[#3399ff]">12</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">Ideas</div>
          </div>
          <div className="text-center border-x border-[#0066cc]/20">
            <div className="text-xl font-bold text-[#8b5cf6] dark:text-[#a78bfa]">8</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">Active</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#10b981] dark:text-[#34d399]">4</div>
            <div className="text-xs text-slate-800 dark:text-slate-400 font-medium">Done</div>
          </div>
        </div>

        {/* Personal Quote/About - More Compact */}
        {profile.aboutMe && (
          <div className="text-center mb-4">
            <p className="text-xs text-slate-700 dark:text-slate-400 italic">"{profile.aboutMe}"</p>
          </div>
        )}

        {/* Skills tags with BGC theme - Fewer Skills Shown */}
        {profile.skills && typeof profile.skills === 'string' && profile.skills.trim() && (
          <div>
            <div className="flex flex-wrap justify-center gap-1">
              {profile.skills.split(',').slice(0, 3).map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#0066cc]/20 dark:text-[#3399ff] rounded-full border border-[#0066cc]/30"
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