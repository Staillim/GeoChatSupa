/**
 * PostgreSQL Hook: use-search-user-postgres
 * Search users by PIN or other criteria
 */

import { useState } from 'react';
import { useUser } from './use-postgres-user';
import { fetcher } from '@/lib/api-client';

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  pin?: string;
}

/**
 * Custom hook for searching users by their PIN code.
 * Returns the found user, loading state, error message, and search function.
 */
export function useSearchUserByPin() {
  const { user: currentUser } = useUser();
  const [user, setUser] = useState<SearchUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByPin = async (pin: string) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para buscar usuarios');
      return;
    }

    if (!pin || pin.length !== 6) {
      setError('El PIN debe tener exactamente 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);
    setUser(null);

    try {
      console.log('🔍 Searching for user with PIN:', pin);
      
      // Search user by PIN using the API
      const result = await fetcher(`/api/users?pin=${pin}`);

      if (!result.users || result.users.length === 0) {
        console.log('❌ No user found with PIN:', pin);
        setUser(null);
      } else {
        const foundUser = result.users[0];
        
        console.log('✅ User found:', foundUser);

        // Check if it's not the current user
        if (foundUser.id === currentUser.uid) {
          setError('No puedes enviarte una solicitud a ti mismo');
          setUser(null);
        } else {
          setUser({
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            avatar: foundUser.avatar,
            bio: foundUser.bio,
            pin: foundUser.pin,
          });
        }
      }
    } catch (err) {
      console.error('❌ Error searching user by PIN:', err);
      setError('Error al buscar el usuario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    searchByPin,
  };
}
