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
      <div className="theme-panel rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-slate-700/30 h-20 w-20"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700/30 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="theme-panel rounded-2xl shadow-xl p-6">
        <p className="text-slate-300 font-medium">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden relative border border-white/10">
      {/* Modern background with floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan-500/5 rounded-full blur-lg"></div>
      </div>

      {/* Header section */}
      <div className="relative p-8 text-center">
        {/* Avatar with enhanced styling */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-lg animate-pulse"></div>
          
          {profile.photoUrl ? (
            <img 
              src={profile.photoUrl} 
              alt={profile.name}
              className="relative w-24 h-24 rounded-full border-4 border-slate-600/50 shadow-2xl object-cover ring-4 ring-blue-500/20"
            />
          ) : (
            <div className="relative w-24 h-24 rounded-full border-4 border-slate-600/50 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center ring-4 ring-blue-500/20">
              <span className="text-2xl font-bold text-white">
                {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-slate-800 shadow-lg">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>

        {/* Name with gradient */}
        <h1 className="text-2xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, var(--blue-400) 0%, var(--accent-purple) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {profile.name}
        </h1>

        {/* Role badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {profile.jobTitle && (
            <span className="inline-flex items-center text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/40 text-blue-300 shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {profile.jobTitle}
            </span>
          )}
          {profile.department && (
            <span className="inline-flex items-center text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/40 text-purple-300 shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
              {profile.department}
            </span>
          )}
        </div>

        {/* Location info if available */}
        {profile.officeLocation && (
          <div className="flex items-center justify-center text-slate-300 mb-6">
            <svg className="w-5 h-5 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{profile.officeLocation}</span>
            {(profile.city || profile.country) && (
              <span className="text-slate-400 ml-1">
                • {[profile.city, profile.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}

        {/* Stats section */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">12</div>
            <div className="text-xs text-slate-400 font-medium">Ideas Submitted</div>
          </div>
          <div className="text-center border-x border-slate-700/50">
            <div className="text-2xl font-bold text-purple-400">8</div>
            <div className="text-xs text-slate-400 font-medium">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">4</div>
            <div className="text-xs text-slate-400 font-medium">Completed</div>
          </div>
        </div>

        {/* About section */}
        {profile.aboutMe && (
          <div className="text-center mb-6">
            <p className="text-sm text-slate-300 italic">"{profile.aboutMe}"</p>
          </div>
        )}

        {/* Skills tags */}
        {profile.skills && typeof profile.skills === 'string' && profile.skills.trim() && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Expertise</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {profile.skills.split(',').slice(0, 4).map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-slate-700/50 text-slate-300 rounded-full border border-slate-600/50"
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