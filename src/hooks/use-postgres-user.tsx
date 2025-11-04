'use client';

import { useAuth } from '@/lib/auth-provider';
import { useUserData } from './use-postgres-data';

/**
 * Hook para obtener el usuario autenticado y sus datos de PostgreSQL
 * Reemplaza completamente el sistema de Firebase
 */
export const useUser = () => {
  const { user, isUserLoading: authLoading, userError } = useAuth();
  
  // Obtener datos completos del usuario desde PostgreSQL
  const { user: userProfile, isLoading: isProfileLoading, isError: profileError } = useUserData(user?.uid || null);

  return { 
    user, // Auth user básico (uid, email)
    userProfile, // Datos completos desde PostgreSQL
    isUserLoading: authLoading || isProfileLoading,
    userError: userError || (profileError ? new Error('Error loading profile') : null)
  };
};

