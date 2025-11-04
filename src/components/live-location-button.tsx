"use client";

import { Button } from '@/components/ui/button';
import { Navigation, Loader2, Send, Check, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationSharingPermission, useLiveLocationSharing } from '@/hooks/use-live-location-postgres';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface LiveLocationButtonProps {
  currentUserId: string;
  recipientId: string;
  disabled?: boolean;
}

export function LiveLocationButton({
  currentUserId,
  recipientId,
  disabled,
}: LiveLocationButtonProps) {
  // Sistema de permisos
  const {
    hasPermission,
    hasSentRequest,
    hasReceivedRequest,
    isLoading: permissionLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
  } = useLocationSharingPermission(currentUserId, recipientId);

  // Sistema de ubicación en tiempo real (SOLO funciona si hasPermission = true)
  const { isSharing, error, startSharing, stopSharing } = useLiveLocationSharing(
    currentUserId,
    recipientId,
    hasPermission
  );

  const [showDialog, setShowDialog] = useState<
    'send' | 'accept' | 'start' | 'stop' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // FLUJO DEL BOTÓN
  const handleClick = () => {
    console.log('🔘 Click en botón:', {
      hasPermission,
      hasSentRequest,
      hasReceivedRequest,
      isSharing,
    });

    // 1. Si hay solicitud recibida → Mostrar diálogo para aceptar/rechazar
    if (hasReceivedRequest) {
      console.log('📨 Mostrando diálogo de aceptar solicitud');
      setShowDialog('accept');
      return;
    }

    // 2. Si NO hay permiso y NO he enviado solicitud → Enviar solicitud
    if (!hasPermission && !hasSentRequest) {
      console.log('📤 Mostrando diálogo de enviar solicitud');
      setShowDialog('send');
      return;
    }

    // 3. Si he enviado solicitud pero aún no hay permiso → NO HACER NADA (bloqueado)
    if (hasSentRequest && !hasPermission) {
      console.log('⏳ Solicitud pendiente, botón bloqueado');
      return;
    }

    // 4. Si hay permiso mutuo → Activar/Desactivar ubicación
    if (hasPermission) {
      if (isSharing) {
        console.log('🛑 Mostrando diálogo de detener ubicación');
        setShowDialog('stop');
      } else {
        console.log('🚀 Mostrando diálogo de activar ubicación');
        setShowDialog('start');
      }
    }
  };

  // Enviar solicitud
  const handleSendRequest = async () => {
    setIsProcessing(true);
    try {
      const success = await sendRequest();
      if (success) {
        setShowDialog(null);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Aceptar solicitud
  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const success = await acceptRequest();
      if (success) {
        setShowDialog(null);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Rechazar solicitud
  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const success = await rejectRequest();
      if (success) {
        setShowDialog(null);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Activar ubicación
  const handleStart = async () => {
    if (!hasPermission) {
      console.error('❌ Intento de activar sin permiso');
      setShowDialog(null);
      return;
    }

    setIsProcessing(true);
    try {
      await startSharing();
      setShowDialog(null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Desactivar ubicación
  const handleStop = async () => {
    setIsProcessing(true);
    try {
      await stopSharing();
      setShowDialog(null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determinar estado visual del botón
  const getButtonState = () => {
    if (isSharing) return 'sharing'; // Verde pulsando
    if (hasReceivedRequest) return 'received'; // Naranja pulsando
    if (hasSentRequest && !hasPermission) return 'pending'; // Azul con spinner
    return 'default'; // Normal
  };

  const buttonState = getButtonState();

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={handleClick}
        disabled={
          disabled ||
          permissionLoading ||
          (hasSentRequest && !hasPermission) // Bloqueado si solicitud pendiente
        }
        className={cn(
          'h-9 w-9 rounded-full transition-all duration-300',
          buttonState === 'sharing' &&
            'bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 text-white shadow-lg animate-pulse',
          buttonState === 'received' &&
            'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-lg animate-pulse',
          buttonState === 'pending' &&
            'bg-gradient-to-br from-sky-300 via-blue-400 to-sky-500 text-white opacity-60 cursor-not-allowed',
          buttonState === 'default' &&
            'hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400'
        )}
      >
        {buttonState === 'sharing' && (
          <Navigation className="h-5 w-5 animate-pulse" />
        )}
        {buttonState === 'received' && <Check className="h-5 w-5" />}
        {buttonState === 'pending' && <Loader2 className="h-5 w-5 animate-spin" />}
        {buttonState === 'default' && <Navigation className="h-5 w-5" />}
      </Button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Diálogo: Enviar solicitud */}
      <AlertDialog open={showDialog === 'send'} onOpenChange={() => setShowDialog(null)}>
        <AlertDialogContent aria-describedby="send-description">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-sky-500" />
              Solicitar ubicación en tiempo real
            </AlertDialogTitle>
            <AlertDialogDescription id="send-description">
              ¿Enviar solicitud para compartir ubicación en tiempo real? El otro usuario
              debe aceptar antes de que ambos puedan activar esta función.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendRequest} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar solicitud
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Aceptar/Rechazar solicitud */}
      <AlertDialog open={showDialog === 'accept'} onOpenChange={() => setShowDialog(null)}>
        <AlertDialogContent aria-describedby="accept-description">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-amber-500" />
              Solicitud de ubicación
            </AlertDialogTitle>
            <AlertDialogDescription id="accept-description">
              Este usuario quiere compartir ubicación en tiempo real contigo. Si aceptas,
              ambos podrán activar esta función.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              className="border-red-300"
            >
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Aceptar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Activar ubicación */}
      <AlertDialog open={showDialog === 'start'} onOpenChange={() => setShowDialog(null)}>
        <AlertDialogContent aria-describedby="start-description">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-500" />
              Activar ubicación en tiempo real
            </AlertDialogTitle>
            <AlertDialogDescription id="start-description">
              Tu ubicación se compartirá continuamente y se actualizará en tiempo real en
              el mapa. Consume más batería.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Detener ubicación */}
      <AlertDialog open={showDialog === 'stop'} onOpenChange={() => setShowDialog(null)}>
        <AlertDialogContent aria-describedby="stop-description">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              Detener ubicación en tiempo real
            </AlertDialogTitle>
            <AlertDialogDescription id="stop-description">
              ¿Detener de compartir tu ubicación en tiempo real? El otro usuario ya no
              podrá ver tu ubicación en el mapa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStop} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deteniendo...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Detener
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
