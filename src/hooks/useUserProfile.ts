import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  _id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin' | 'super_admin';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string; // This is a required field
  updatedAt: string; // This is a required field
}

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Assuming 'user' from useAuth has at least _id, email, status, and role.
        // You'll need to ensure createdAt and updatedAt are available or mocked.
        // If your 'user' object from useAuth is indeed meant to be a full UserProfile,
        // then your AuthContext needs to return the full UserProfile.
        // Otherwise, you need to construct it here.
        const userProfile: UserProfile = {
          _id: user._id, // Assuming user._id exists
          email: user.email,
          status: user.status,
          role: user.role,
          // If approvedBy and approvedAt are part of 'user', include them:
          approvedBy: user.approvedBy || undefined,
          approvedAt: user.approvedAt || undefined,
          // IMPORTANT: You need to get createdAt and updatedAt from somewhere.
          // If they are not on the `user` object from `useAuth`, you might need to:
          // 1. Fetch the full user profile from your backend here.
          // 2. Add default values if this `useUserProfile` hook is for initial setup
          //    before a full profile is fetched (less ideal for production).
          // For demonstration, let's assume they might be present or we can provide a fallback:
          createdAt: user.createdAt || new Date().toISOString(), // Provide a fallback if not present
          updatedAt: user.updatedAt || new Date().toISOString(), // Provide a fallback if not present
        };

        setProfile(userProfile);
        fetchedForUser.current = user._id;
      } else {
        setProfile(null);
        fetchedForUser.current = null;
      }
      setLoading(false);
      setError(null);
    }
  }, [user, authLoading]);

  const isApproved = profile?.status === 'approved';
  const isSuperAdmin = profile?.role === 'super_admin' && profile?.status === 'approved';
  const isPending = profile?.status === 'pending';
  const isRejected = profile?.status === 'rejected';

  return {
    profile,
    loading: authLoading || loading,
    error,
    isApproved,
    isSuperAdmin,
    isPending,
    isRejected,
    refetch: () => {
      // Profile is automatically updated through auth context
      // If you need to refetch full profile data, this is where
      // you would trigger a fetch operation.
    },
  };
};