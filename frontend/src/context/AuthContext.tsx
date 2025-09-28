'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Import Cookies

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
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Simulate a successful login directly
  const login = useCallback(async (email: string, password: string) => {
    console.log('Iniciando proceso de login con email:', email); // Debug log 1: Start of login process

    // Basic validation: check if email and password are provided
    if (!email || !password) {
      console.error('Email and password are required for login.');
      // In a real app, you might set an error state here.
      // For this simulation, we just prevent the login process.
      return;
    }

    setLoading(true);
    console.log('Estado de loading establecido a true.'); // Debug log 2: Loading state set to true

    try {
      // Simulate a successful login with mock data
      const mockUser = {
        id: 'mock-user-id',
        email: email, // Use provided email
        name: 'Usuario Simulad',
        createdAt: new Date().toISOString(),
      };
      const mockAccessToken = `mock-access-token-${mockUser.id}-${Date.now()}`;
      console.log('Datos de usuario y token simulados creados:', { mockUser, mockAccessToken }); // Debug log 3: Mock data created

      setUser(mockUser);
      setAccessToken(mockAccessToken);
      console.log('Estado de usuario y accessToken actualizados.'); // Debug log 4: State updated

      console.log('Simulación de inicio de sesión exitosa.');
      console.log('Redirigiendo a /dashboard...'); // Debug log 5: Redirecting
      router.push('/dashboard');
    } catch (error) {
      console.error('Error en la simulación de inicio de sesión:', error);
      setLoading(false); // Ensure loading is false if an error occurs during simulation
    }
  }, [router]);

  const logout = useCallback(() => {
    console.log('Iniciando proceso de logout.'); // Debug log for logout
    setUser(null);
    setAccessToken(null);
    Cookies.remove('accessToken'); // Remove cookies on logout
    Cookies.remove('refreshToken');
    console.log('Simulación de cierre de sesión.');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const loadInitialState = async () => {
      const storedAccessToken = Cookies.get('accessToken');
      const storedRefreshToken = Cookies.get('refreshToken');

      if (storedAccessToken && storedRefreshToken) {
        // In a real app, you'd validate the tokens with a backend call
        // For this mock, we'll assume they are valid and set the user
        setAccessToken(storedAccessToken);
        // Simulate user data based on the token (e.g., decode JWT)
        // For simplicity, we'll use a generic mock user
        setUser({
          id: 'mock-user-id',
          email: 'test@example.com', // Assuming a default email for the mock user
          name: 'Usuario Simulad',
          createdAt: new Date().toISOString(),
        });
        console.log('Estado inicial cargado desde cookies, usuario autenticado.');
      } else {
        console.log('No se encontraron tokens en cookies, usuario no autenticado.');
      }
      setLoading(false);
      console.log('Estado inicial cargado, loading establecido a false.'); // Debug log for initial state load
    };

    loadInitialState();
  }, []); // Empty dependency array means this runs once on mount

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated, loading }}>
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
