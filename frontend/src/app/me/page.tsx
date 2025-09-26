'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { accessToken, isAuthenticated, loading, logout, refreshAccessToken } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Retry with new token
          const retryResponse = await fetch('/users/me', {
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
            },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setUserProfile(data);
            setNewName(data.name);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } else if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setNewName(data.name);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      logout();
    }
  }, [accessToken, refreshAccessToken, logout]);

  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      fetchProfile();
    }
  }, [isAuthenticated, userProfile, fetchProfile]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newName.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    if (!accessToken) {
      setError('Not authenticated.');
      return;
    }

    try {
      const response = await fetch('/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Retry with new token
          const retryResponse = await fetch('/users/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`,
            },
            body: JSON.stringify({ name: newName }),
          });
          if (retryResponse.ok) {
            const updatedData = await retryResponse.json();
            setUserProfile(updatedData);
            setMessage('Profile updated successfully!');
            setEditMode(false);
          } else {
            setError('Failed to update profile after token refresh.');
          }
        } else {
          setError('Failed to refresh token and update profile.');
        }
      } else if (response.ok) {
        const updatedData = await response.json();
        setUserProfile(updatedData);
        setMessage('Profile updated successfully!');
        setEditMode(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred during update.');
    }
  };

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (!userProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">My Profile</h1>
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-semibold">Name:</span> {userProfile.name}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Email:</span> {userProfile.email}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Member Since:</span> {new Date(userProfile.createdAt).toLocaleDateString()}
          </p>
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateName} className="mt-4">
            <div className="mb-4">
              <label htmlFor="newName" className="block text-gray-700 text-sm font-bold mb-2">
                New Name:
              </label>
              <input
                type="text"
                id="newName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setNewName(userProfile.name); // Reset name if cancelling
                  setError('');
                  setMessage('');
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setEditMode(true)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Edit Name
            </button>
          </div>
        )}
        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-blue-500 hover:underline">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
