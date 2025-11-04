"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  startLiveLocationSharing,
  updateLiveLocation,
  stopLiveLocationSharing,
  updateLocationSharingRequests,
  updateLocationSharingWith,
  useUserData
} from './use-postgres-data';

/**
 * Hook para manejar permisos de ubicación compartida
 * Reemplaza: useLocationSharingPermission de Firestore
 */
export function useLocationSharingPermission(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const [hasPermission, setHasPermission] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener datos de ambos usuarios
  const { user: currentUser, mutate: mutateCurrentUser } = useUserData(currentUserId || null);
  const { user: otherUser } = useUserData(otherUserId || null);

  // Verificar estados de permiso
  useEffect(() => {
    if (!currentUser || !otherUser) {
      setIsLoading(false);
      return;
    }

    const currentUserSharing = currentUser.location_sharing_with || [];
    const currentUserRequests = currentUser.location_sharing_requests || [];
    const otherUserSharing = otherUser.location_sharing_with || [];
    const otherUserRequests = otherUser.location_sharing_requests || [];

    // Tiene permiso si ambos se tienen en sus listas
    const permission = currentUserSharing.includes(otherUserId!) && otherUserSharing.includes(currentUserId!);
    setHasPermission(permission);

    // Ha enviado solicitud
    setHasSentRequest(otherUserRequests.includes(currentUserId!));

    // Ha recibido solicitud
    setHasReceivedRequest(currentUserRequests.includes(otherUserId!));

    setIsLoading(false);
  }, [currentUser, otherUser, currentUserId, otherUserId]);

  // Enviar solicitud
  const sendRequest = useCallback(async () => {
    if (!currentUserId || !otherUserId || !currentUser) return false;

    try {
      const currentRequests = otherUser?.location_sharing_requests || [];
      const result = await updateLocationSharingRequests(otherUserId, [...currentRequests, currentUserId]);
      
      if (result.success) {
        setHasSentRequest(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      return false;
    }
  }, [currentUserId, otherUserId, currentUser, otherUser]);

  // Aceptar solicitud
  const acceptRequest = useCallback(async () => {
    if (!currentUserId || !otherUserId || !currentUser) return false;

    try {
      // Remover de requests
      const currentRequests = (currentUser.location_sharing_requests || []).filter(id => id !== otherUserId);
      await updateLocationSharingRequests(currentUserId, currentRequests);

      // Agregar a ambos usuarios en sharing_with
      const currentSharing = currentUser.location_sharing_with || [];
      const otherSharing = otherUser?.location_sharing_with || [];

      await updateLocationSharingWith(currentUserId, [...currentSharing, otherUserId]);
      await updateLocationSharingWith(otherUserId, [...otherSharing, currentUserId]);

      setHasReceivedRequest(false);
      setHasPermission(true);
      mutateCurrentUser(); // Revalidar datos
      return true;
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      return false;
    }
  }, [currentUserId, otherUserId, currentUser, otherUser, mutateCurrentUser]);

  // Rechazar solicitud
  const rejectRequest = useCallback(async () => {
    if (!currentUserId || !otherUserId || !currentUser) return false;

    try {
      const currentRequests = (currentUser.location_sharing_requests || []).filter(id => id !== otherUserId);
      const result = await updateLocationSharingRequests(currentUserId, currentRequests);
      
      if (result.success) {
        setHasReceivedRequest(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      return false;
    }
  }, [currentUserId, otherUserId, currentUser]);

  return {
    hasPermission,
    hasSentRequest,
    hasReceivedRequest,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest
  };
}

/**
 * Hook para manejar ubicación en tiempo real
 * Reemplaza: useLiveLocationSharing de Firestore
 */
export function useLiveLocationSharing(
  currentUserId: string | undefined,
  recipientId: string | undefined,
  hasPermission: boolean
) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Iniciar compartir ubicación
  const startSharing = useCallback(async () => {
    if (!hasPermission || !currentUserId || !recipientId) {
      setError('No hay permiso para compartir ubicación');
      return;
    }

    try {
      // Obtener ubicación inicial
      if (!navigator.geolocation) {
        setError('Geolocalización no disponible');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Iniciar en PostgreSQL
          const result = await startLiveLocationSharing({
            user_id: currentUserId,
            shared_with: recipientId,
            latitude,
            longitude,
            accuracy: accuracy || undefined
          });

          if (result.success) {
            setIsSharing(true);
            setError(null);

            // Iniciar actualización continua
            const id = navigator.geolocation.watchPosition(
              async (pos) => {
                await updateLiveLocation({
                  user_id: currentUserId,
                  shared_with: recipientId,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || undefined
                });
              },
              (err) => {
                console.error('Error actualizando ubicación:', err);
              },
              {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 60000
              }
            );
            setWatchId(id);
          } else {
            setError('Error iniciando ubicación');
          }
        },
        (err) => {
          setError(err.message);
        }
      );
    } catch (err: any) {
      setError(err.message);
    }
  }, [hasPermission, currentUserId, recipientId]);

  // Detener compartir ubicación
  const stopSharing = useCallback(async () => {
    if (!currentUserId || !recipientId) return;

    try {
      // Detener watch de geolocalización
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      // Detener en PostgreSQL
      const result = await stopLiveLocationSharing(currentUserId, recipientId);
      
      if (result.success) {
        setIsSharing(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUserId, recipientId, watchId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    isSharing,
    error,
    startSharing,
    stopSharing
  };
}
