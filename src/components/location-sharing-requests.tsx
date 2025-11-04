"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation, Check, X } from 'lucide-react';
import { useUser } from '@/hooks/use-postgres-user';
import { showNotification, NotificationTypes } from '@/hooks/use-notifications';
import { fetcher, putData } from '@/lib/api-client';

interface LocationRequest {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string | null;
}

export function LocationSharingRequests() {
  const { user, userProfile } = useUser();
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Obtener IDs de usuarios que solicitan compartir ubicación
        const requestUids = userProfile?.location_sharing_requests || [];
        
        if (requestUids.length === 0) {
          setRequests([]);
          setIsLoading(false);
          return;
        }
        
        // Obtener información de cada usuario que solicita
        const requestsData: LocationRequest[] = [];
        for (const uid of requestUids) {
          try {
            const response = await fetcher(`/api/users/${uid}`);
            if (response?.user) {
              requestsData.push({
                id: response.user.id,
                name: response.user.name || response.user.email?.split('@')[0] || 'Usuario',
                avatar: response.user.avatar || null,
                email: response.user.email || null,
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${uid}:`, error);
          }
        }
        
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching location requests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [user?.uid, userProfile?.location_sharing_requests]);

  const handleAccept = async (requesterUid: string) => {
    if (!user?.uid) return;
    
    setProcessingUid(requesterUid);
    
    try {
      // Obtener arrays actuales
      const currentRequests = userProfile?.location_sharing_requests || [];
      const currentSharing = userProfile?.location_sharing_with || [];
      
      // Remover de solicitudes y agregar a compartidos
      const newRequests = currentRequests.filter((id: string) => id !== requesterUid);
      const newSharing = [...currentSharing, requesterUid];
      
      await putData(`/api/users/${user.uid}`, {
        location_sharing_requests: newRequests,
        location_sharing_with: newSharing
      });
      
      // Encontrar el nombre del solicitante para la notificación
      const requester = requests.find(r => r.id === requesterUid);
      if (requester) {
        showNotification(
          NotificationTypes.locationSharingAccepted(requester.name).title,
          NotificationTypes.locationSharingAccepted(requester.name)
        );
      }
      
      // Actualizar estado local
      setRequests(prev => prev.filter(r => r.id !== requesterUid));
      
      console.log(`✅ Solicitud aceptada de ${requesterUid}`);
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      alert('Error al aceptar la solicitud');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReject = async (requesterUid: string) => {
    if (!user?.uid) return;
    
    setProcessingUid(requesterUid);
    
    try {
      // Obtener array actual de solicitudes
      const currentRequests = userProfile?.location_sharing_requests || [];
      
      // Remover de solicitudes
      const newRequests = currentRequests.filter((id: string) => id !== requesterUid);
      
      await putData(`/api/users/${user.uid}`, {
        location_sharing_requests: newRequests
      });
      
      // Actualizar estado local
      setRequests(prev => prev.filter(r => r.id !== requesterUid));
      
      console.log(`❌ Solicitud rechazada de ${requesterUid}`);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setProcessingUid(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-sky-200 dark:border-sky-800 shimmer-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
            <Navigation className="h-5 w-5" />
            Solicitudes de Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // No mostrar la card si no hay solicitudes
  }

  return (
    <Card className="border-2 border-sky-200 dark:border-sky-800 shimmer-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
          <Navigation className="h-5 w-5" />
          Solicitudes de Ubicación en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Estos usuarios quieren ver tu ubicación automáticamente en el mapa
        </p>
        
        {requests.map((request) => (
          <div 
            key={request.id}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <Avatar className="h-12 w-12 ring-2 ring-sky-400">
              <AvatarImage src={request.avatar || ''} alt={request.name} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                {request.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{request.name}</p>
              {request.email && (
                <p className="text-xs text-muted-foreground truncate">{request.email}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                disabled={processingUid === request.id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request.id)}
                disabled={processingUid === request.id}
                className="border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
