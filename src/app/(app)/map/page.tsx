'use client';
import dynamic from 'next/dynamic';
import { useUser } from '@/hooks/use-postgres-user';
import { useAllUsers, useLiveLocations } from '@/hooks/use-postgres-data';
import { Skeleton } from '@/components/ui/skeleton';

// Importar MapComponent dinámicamente solo en el cliente para evitar errores de SSR con Leaflet
const MapComponent = dynamic(
  () => import('@/components/map-component').then((mod) => ({ default: mod.MapComponent })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-sky-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const { users, isLoading: isUsersLoading } = useAllUsers();
  const { liveLocations, isLoading: isLiveLocationsLoading } = useLiveLocations(user?.uid);

  if (isUserLoading || isUsersLoading || isLiveLocationsLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-96" />
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center p-4 bg-card rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">No se pudo cargar tu perfil</h2>
          <p>Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  // Filtrar el usuario actual de la lista de usuarios
  const otherUsers = users.filter(u => u.uid !== user.uid).map(u => ({
    uid: u.uid || u.id,
    email: u.email,
    displayName: u.displayName || u.name,
    lat: u.lat ?? undefined,
    lng: u.lng ?? undefined,
    photoURL: u.photoURL || u.avatar
  }));
  
  // Usar photoURL de userProfile (PostgreSQL) si existe, sino de user (Auth)
  const currentUserPhoto = userProfile.photoURL || user.photoURL;
  
  // Transform live locations to match expected format
  const transformedLiveLocations = liveLocations.map(loc => ({
    id: loc.id,
    userId: loc.userId || loc.user_id,
    userName: loc.userName || 'Usuario',
    userPhoto: loc.userPhoto || null,
    latitude: loc.latitude,
    longitude: loc.longitude,
    lastUpdated: loc.lastUpdated as any, // Compatible with Firebase Timestamp
    sharedWith: loc.sharedWith || loc.shared_with,
    isActive: loc.isActive ?? true
  })) as any; // Type assertion for Firebase compatibility
  
  console.log('🗺️ MapPage - Datos:', {
    totalUsers: users.length,
    otherUsers: otherUsers.length,
    currentUser: {
      uid: user.uid,
      displayName: userProfile.displayName,
      photoURL: currentUserPhoto,
      lat: userProfile.lat,
      lng: userProfile.lng
    },
    liveLocations: transformedLiveLocations.length
  });
  
  return (
    <div className="h-full w-full">
      <MapComponent 
        users={otherUsers} 
        currentUser={{
          uid: user.uid,
          email: user.email,
          displayName: userProfile.displayName || user.displayName || 'Usuario',
          lat: userProfile.lat ?? 34.054,
          lng: userProfile.lng ?? -118.242,
          photoURL: currentUserPhoto
        }}
        sharedLocations={[]} // TODO: Implementar shared locations desde PostgreSQL
        liveLocations={transformedLiveLocations}
      />
    </div>
  );
}
