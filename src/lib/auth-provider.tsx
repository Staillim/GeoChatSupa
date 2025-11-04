'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

/**
 * Sistema de autenticación simple usando PostgreSQL
 * Reemplaza completamente Firebase Auth
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextState {
  user: AuthUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider maneja el estado de autenticación del usuario
 * Por ahora usa localStorage, pero se puede integrar con NextAuth o similar
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // Intentar cargar usuario desde localStorage
    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUserError(error as Error);
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  const contextValue: AuthContextState = {
    user,
    isUserLoading,
    userError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acceder al usuario autenticado
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Funciones de autenticación
 */

export const signIn = async (email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  try {
    // Llamar a la API de login
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Error al iniciar sesión' };
    }

    const authUser: AuthUser = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      photoURL: data.user.avatar
    };
    
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    window.location.reload(); // Recargar para actualizar el contexto
    
    return { success: true, user: authUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOut = async (): Promise<void> => {
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
};

export const signUp = async (email: string, password: string, displayName: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  try {
    // Llamar a la API de registro
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name: displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Error al registrarse' };
    }

    const authUser: AuthUser = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      photoURL: data.user.avatar
    };
    
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    
    return { success: true, user: authUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
