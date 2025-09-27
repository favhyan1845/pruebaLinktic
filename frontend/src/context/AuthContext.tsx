'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter for navigation

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
  // refreshToken is no longer needed as we won't be refreshing tokens via API
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Simulate a successful login directly
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate a successful login with mock data
      const mockUser = {
        id: 'mock-user-id',
        email: email, // Use provided email
        name: 'Usuario Simulad',
        createdAt: new Date().toISOString(),
      };
      const mockAccessToken = `mock-access-token-${mockUser.id}-${Date.now()}`;

      setUser(mockUser);
      setAccessToken(mockAccessToken);
      // No need to store in cookies or use refreshToken

      console.log('Simulación de inicio de sesión exitosa.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error en la simulación de inicio de sesión:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    // No need to clear cookies or tokens
    console.log('Simulación de cierre de sesión.');
    router.push('/login');
  }, [router]);

  // Simulate token refresh, though not strictly necessary if login sets tokens directly
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // In a real app, this would fetch a new token. Here, we just simulate success.
    // If accessToken is already set, we can assume it's valid for this mock.
    if (accessToken) {
      console.log('Simulación de refresco de token exitoso.');
      // Optionally, generate a new mock token if needed for more complex scenarios
      // const newMockAccessToken = `mock-access-token-${user?.id || 'mock-user-id'}-${Date.now()}`;
      // setAccessToken(newMockAccessToken);
      return accessToken;
    }
    logout(); // If no access token, simulate logout
    return null;
  }, [accessToken, logout]);

  useEffect(() => {
    // On initial load, check if there's a mock accessToken (e.g., from a previous session if we were to implement persistence)
    // For now, we'll just set a default state or check if user is already logged in.
    // If we want to simulate persistence, we'd need a way to store mock tokens.
    // For simplicity, let's assume no persistence for now, or a very basic one.
    // If we want to simulate a logged-in state on refresh, we can set mock data.
    const loadInitialState = async () => {
      // In a real scenario, you'd check cookies or local storage for tokens.
      // For this mock, we'll assume the user is not logged in initially unless we add persistence.
      // If we want to simulate a logged-in user on refresh, we could do something like:
      // const mockUser = { id: 'mock-user-id', email: 'test@example.com', name: 'Usuario Simulad', createdAt: new Date().toISOString() };
      // const mockAccessToken = 'mock-access-token-mock-user-id-12345';
      // setUser(mockUser);
      // setAccessToken(mockAccessToken);
      // console.log('Estado inicial simulado cargado.');
      setLoading(false);
    };

    loadInitialState();
  }, []); // Empty dependency array means this runs once on mount

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
