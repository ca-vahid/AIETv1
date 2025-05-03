'use client';

import React, { useState } from "react";
import useSessionProfile from "@/lib/hooks/useSessionProfile";
import { UserProfile } from "@/app/api/profile/route";

/**
 * ProfileInfo component displays and allows editing of user profile information
 */
export default function ProfileInfo() {
  const { profile, updateProfile } = useSessionProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile> | null>(profile);

  const handleSave = async () => {
    if (editedProfile) {
      await updateProfile(editedProfile);
      setIsEditing(false);
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Edit
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedProfile(profile);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          // Edit mode
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={editedProfile?.name || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                value={editedProfile?.jobTitle || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, jobTitle: e.target.value} : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={editedProfile?.department || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, department: e.target.value} : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Office Location</label>
              <input
                type="text"
                value={editedProfile?.officeLocation || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, officeLocation: e.target.value} : null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        ) : (
          // View mode
          <>
            <div>
              <span className="text-sm text-gray-500">Name</span>
              <p className="text-gray-900">{profile.name || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Job Title</span>
              <p className="text-gray-900">{profile.jobTitle || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Department</span>
              <p className="text-gray-900">{profile.department || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Office Location</span>
              <p className="text-gray-900">{profile.officeLocation || 'Not set'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 