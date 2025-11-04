'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/auth-provider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("AuthLayout - Estado del usuario:", { user: user?.email, isUserLoading });
    if (!isUserLoading && user) {
      console.log("AuthLayout - Usuario ya autenticado, redirigiendo a /map");
      router.push('/map');
    }
  }, [user, isUserLoading, router]);

  // Mostrar loading mientras verificamos el estado del usuario
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Si el usuario está autenticado, no mostrar el layout de auth (se está redirigiendo)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
