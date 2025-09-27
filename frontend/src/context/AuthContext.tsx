'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const saveTokens = useCallback((newAccessToken: string, newRefreshToken: string) => {
    Cookies.set('accessToken', newAccessToken);
    Cookies.set('refreshToken', newRefreshToken);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    // In a real app, you'd decode the access token to get user info
    // For this mock, we'll assume a simple user structure
    const decoded: any = jwtDecode(newAccessToken); // jwtDecode expects a real JWT, this will fail with mock tokens
    setUser({
      id: '1', // Mock user ID
      email: 'test@example.com', // Mock email
      name: 'Test User', // Mock name
      createdAt: new Date().toISOString(), // Mock creation date
    });
  }, []);

  const clearTokens = useCallback(() => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login API error:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
      console.log('Login successful, tokens received:', { newAccessToken, newRefreshToken });
      saveTokens(newAccessToken, newRefreshToken);
      console.log('Tokens saved, attempting to redirect to /dashboard');
      router.push('/dashboard');
      console.log('Redirect initiated.');
    } catch (error) {
      console.error('Login process failed:', error);
    } finally {
      setLoading(false);
    }
  }, [saveTokens, router]);

  const logout = useCallback(() => {
    clearTokens();
    router.push('/login');
  }, [clearTokens, router]);

  const refreshAccessToken = useCallback(async () => {
    const currentRefreshToken = Cookies.get('refreshToken');
    if (!currentRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await fetch('/users/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        logout();
        return null;
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
      saveTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return null;
    }
  }, [logout, saveTokens]);

  useEffect(() => {
    const loadTokens = async () => {
      const storedAccessToken = Cookies.get('accessToken');
      const storedRefreshToken = Cookies.get('refreshToken');

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        // For mock, assume user is logged in if tokens exist
        setUser({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
        });
      }
      setLoading(false);
    };

    loadTokens();
  }, []);

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refreshAccessToken, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
