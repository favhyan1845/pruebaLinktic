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
  const { user, isAuthenticated, loading, logout } = useAuth(); // Removed accessToken, refreshAccessToken
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Re-introduce userProfile state
  const [newName, setNewName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  console.log('ProfilePage: Component mounted'); // Debug log: Component mount

  useEffect(() => {
    console.log('ProfilePage: useEffect for redirect - loading:', loading, 'isAuthenticated:', isAuthenticated); // Debug log: Redirect effect start
    if (!loading && !isAuthenticated) {
      console.log('ProfilePage: Not authenticated, redirecting to /login');
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Initialize userProfile from useAuth().user and set newName
  useEffect(() => {
    console.log('ProfilePage: useEffect for data initialization - isAuthenticated:', isAuthenticated, 'user:', user); // Debug log: Data initialization effect start
    if (isAuthenticated && user) {
      setUserProfile({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      });
      setNewName(user.name); // Initialize newName with current user's name
      console.log('ProfilePage: User profile initialized and newName set.'); // Debug log: Data initialized
    } else if (!isAuthenticated && !loading) {
      // If not authenticated and not loading, redirect to login
      console.log('ProfilePage: Not authenticated and not loading, redirecting to /login');
      router.push('/login');
    }
  }, [isAuthenticated, user, loading, router]);

  const handleUpdateName = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ProfilePage: handleUpdateName called'); // Debug log: handleUpdateName called
    setError('');
    setMessage('');

    if (!newName.trim()) {
      setError('Name cannot be empty.');
      console.error('ProfilePage: Name cannot be empty.'); // Debug log: Validation error
      return;
    }

    // Update the local userProfile state
    setUserProfile((prevProfile) => {
      console.log('ProfilePage: Updating userProfile state'); // Debug log: Updating state
      if (prevProfile) {
        const updatedProfile = { ...prevProfile, name: newName };
        setMessage('Profile updated successfully!');
        setEditMode(false);
        console.log('ProfilePage: User profile updated, editMode set to false, message set.'); // Debug log: State updated successfully
        return updatedProfile;
      }
      console.log('ProfilePage: prevProfile is null, returning prevProfile.'); // Debug log: prevProfile is null
      return prevProfile; // Should not happen if user is authenticated and userProfile is initialized
    });
  }, [newName, user]); // Added user to dependencies for resetting newName

  // If user is null but authenticated (e.g., initial load before user data is ready), show loading
  if (loading || (!user && isAuthenticated)) {
    console.log('ProfilePage: Rendering loading state'); // Debug log: Rendering loading
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  // If not authenticated, redirect handled by useEffect. If authenticated but no user data, show loading.
  if (!user) {
    console.log('ProfilePage: User is null, rendering loading profile...'); // Debug log: Rendering loading profile
    // This case should ideally not be reached if isAuthenticated is true and loading is false
    // but as a fallback, show loading or redirect.
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading profile...</div>;
  }

  console.log('ProfilePage: Rendering profile details'); // Debug log: Rendering profile details

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">My Profile</h1>
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-semibold">Name:</span> {userProfile?.name} {/* Use userProfile.name */}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Email:</span> {userProfile?.email} {/* Use userProfile.email */}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Member Since:</span> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : ''} {/* Use userProfile.createdAt */}
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
                onChange={(e) => {
                  console.log('ProfilePage: New name input changed to', e.target.value); // Debug log: Input change
                  setNewName(e.target.value);
                }}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  console.log('ProfilePage: Cancel edit mode'); // Debug log: Cancel edit
                  setEditMode(false);
                  setNewName(userProfile?.name || ''); // Reset name if cancelling, using userProfile.name
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
              onClick={() => {
                console.log('ProfilePage: Enter edit mode'); // Debug log: Enter edit mode
                setEditMode(true);
                // Ensure newName is initialized with the current user's name when entering edit mode
                setNewName(userProfile?.name || ''); // Initialize with userProfile.name
              }}
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
