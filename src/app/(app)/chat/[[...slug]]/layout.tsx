'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useUser } from '@/hooks/use-postgres-user';
import { useConversations, sendMessage as sendMessageAPI } from '@/hooks/use-postgres-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { AttachImageButton } from '@/components/attach-image-button';
import { ShareLocationButton } from '@/components/share-location-button';
import { LiveLocationButton } from '@/components/live-location-button';

interface MessageData {
  type: 'text' | 'image' | 'location';
  text?: string;
  imageBase64?: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
    duration?: number;
  };
}

export default function ChatIndividualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Obtener conversaciones para encontrar la actual
  const { conversations, isLoading: isConversationLoading } = useConversations(user?.uid);
  
  // Encontrar la conversación actual
  const conversation = useMemo(() => {
    return conversations.find((c: any) => c.id === conversationId);
  }, [conversations, conversationId]);

  // Obtener el otro participante de los datos ya cargados
  const otherParticipant = useMemo(() => {
    if (!conversation?.participantsData || !user?.uid) return null;
    return conversation.participantsData.find((p: any) => p.id !== user.uid);
  }, [conversation, user]);

  const otherUserDisplayName = otherParticipant?.name || otherParticipant?.email?.split('@')[0] || 'Usuario';
  const otherUserPhotoURL = otherParticipant?.avatar || null;
  const otherUserInitials = otherUserDisplayName.charAt(0).toUpperCase();

  // Estados de la conversación
  const isPending = conversation?.status === 'pending';
  const isActive = conversation?.status === 'active';
  const isCreator = conversation?.created_by === user?.uid;
  const canSendMessages = isActive;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !canSendMessages || !user || !conversationId) return;
    
    setIsSending(true);
    try {
      await sendMessageAPI(conversationId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_id: user.uid,
        text: messageText,
        read: false,
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSend = async (base64: string) => {
    if (!canSendMessages || !user || !conversationId) return;
    
    setIsSending(true);
    try {
      await sendMessageAPI(conversationId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_id: user.uid,
        text: '📷 Imagen',
        image_url: base64,
        read: false,
      });
    } catch (error) {
      console.error('Error sending image:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleLocationShare = async (location: { 
    latitude: number; 
    longitude: number; 
    timestamp: number;
    duration?: number;
  }) => {
    if (!canSendMessages || !user || !conversationId) return;
    
    setIsSending(true);
    try {
      await sendMessageAPI(conversationId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_id: user.uid,
        text: '📍 Ubicación compartida',
        location_lat: location.latitude,
        location_lng: location.longitude,
        read: false,
      });
    } catch (error) {
      console.error('Error sending location:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Selecciona una conversación para empezar a chatear</p>
        </div>
      </div>
    );
  }

  if (isConversationLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 flex items-center gap-4 border-b bg-card px-4 h-14 lg:h-[60px]">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Conversación no encontrada</p>
          <Link href="/chat">
            <Button variant="outline" className="mt-4">Volver a conversaciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* HEADER - Fijo arriba */}
      <header className="flex-shrink-0 flex items-center gap-4 border-b border-sky-200 dark:border-sky-900 bg-gradient-to-r from-white/95 via-sky-50/90 to-white/95 dark:from-slate-900/95 dark:via-sky-950/90 dark:to-slate-900/95 backdrop-blur-md px-4 h-14 lg:h-[60px] overflow-hidden group shimmer-effect shadow-lg shadow-sky-200/50 dark:shadow-sky-900/50 relative z-10">
        {/* Orbes decorativos de fondo con colores azules */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-sky-400/20 dark:bg-sky-500/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 floating-orb" />
        <div className="absolute -top-4 left-1/2 w-24 h-24 bg-blue-300/15 dark:bg-blue-400/20 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 floating-orb" style={{ animationDelay: '1s' }} />
        
        <Link href="/chat" className="md:hidden relative z-10">
          <Button variant="ghost" size="icon" className="hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:scale-110 transition-all duration-300 rounded-full glow-effect">
            <ArrowLeft className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </Button>
        </Link>
        
        {/* Área clickeable para ver perfil */}
        <button
          onClick={() => setIsProfileDialogOpen(true)}
          className="flex items-center gap-3 relative z-10 flex-1 hover:bg-sky-100/50 dark:hover:bg-sky-900/20 rounded-lg px-2 py-1 -mx-2 transition-all duration-300 group/profile"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-blue-400/30 rounded-full blur-lg opacity-0 group-hover/profile:opacity-100 transition-opacity duration-300" />
            <Avatar className="relative ring-2 ring-sky-200 dark:ring-sky-700 shadow-lg shadow-sky-300/50 dark:shadow-sky-800/50 transition-all duration-300 group-hover/profile:scale-110 group-hover/profile:rotate-3">
              <AvatarImage src={otherUserPhotoURL || ''} alt={otherUserDisplayName} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                {otherUserInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-left">
            <h2 className="font-bold text-lg bg-gradient-to-r from-sky-700 to-blue-600 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent group-hover/profile:scale-105 transition-transform duration-300">
              {otherUserDisplayName}
            </h2>
            {isPending && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                {isCreator ? 'Solicitud enviada' : 'Solicitud pendiente'}
              </p>
            )}
          </div>
        </button>
      </header>

      {/* Mensaje de estado pendiente */}
      {isPending && (
        <div className="flex-shrink-0 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 border-b border-amber-200 dark:border-amber-800 p-4 overflow-hidden shimmer-effect relative">
          {/* Orbe animado */}
          <div className="absolute -left-4 top-0 w-20 h-20 bg-amber-400/30 rounded-full blur-2xl animate-pulse-glow floating-orb" />
          <div className="absolute -right-4 top-0 w-16 h-16 bg-orange-400/20 rounded-full blur-xl animate-pulse-glow floating-orb" style={{ animationDelay: '1.5s' }} />
          <p className="text-sm text-amber-900 dark:text-amber-200 text-center font-medium relative z-10 flex items-center justify-center gap-2">
            <span className="text-xl">{isCreator ? '⏳' : '📩'}</span>
            {isCreator 
              ? 'Esperando que el usuario acepte tu solicitud de chat...'
              : 'Este usuario quiere chatear contigo. Acepta la solicitud arriba para comenzar.'
            }
          </p>
        </div>
      )}

      {/* ÁREA DE MENSAJES CON SCROLL INTERNO - Solo esta área hace scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
        {children}
      </div>

      {/* FOOTER - Fijo abajo */}
      <footer className="flex-shrink-0 border-t border-sky-200 dark:border-sky-900 px-4 py-4 bg-gradient-to-r from-white/95 via-sky-50/90 to-white/95 dark:from-slate-900/95 dark:via-sky-950/90 dark:to-slate-900/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(56,189,248,0.15)] relative z-10">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
          {/* Orbes flotantes en el footer */}
          <div className="absolute -top-10 left-1/4 w-20 h-20 bg-sky-400/10 dark:bg-sky-500/20 rounded-full blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 floating-orb" />
          <div className="absolute -top-8 right-1/4 w-16 h-16 bg-blue-400/10 dark:bg-blue-500/15 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 floating-orb" style={{ animationDelay: '0.5s' }} />
          
          <div className="flex items-center gap-2">
            {/* Botones de adjuntar */}
            <div className="flex gap-1">
              <AttachImageButton
                onImageSelected={handleImageSend}
                disabled={!canSendMessages || isSending}
              />
              <ShareLocationButton
                onLocationShared={handleLocationShare}
                disabled={!canSendMessages || isSending}
              />
              {/* Botón de ubicación en tiempo real */}
              {user?.uid && otherParticipant?.id && (
                <LiveLocationButton
                  currentUserId={user.uid}
                  recipientId={otherParticipant.id}
                  disabled={!canSendMessages || isSending}
                />
              )}
            </div>

            {/* Input y botón de enviar */}
            <div className="flex-1 relative">
              <Input 
                placeholder={canSendMessages ? "Escribe un mensaje..." : "Acepta la solicitud para enviar mensajes"}
                className="pr-12 rounded-full border-2 border-sky-200 dark:border-sky-800 focus:border-sky-400 dark:focus:border-sky-500 transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 focus:shadow-lg focus:shadow-sky-200/50 dark:focus:shadow-sky-900/50 shimmer-effect" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!canSendMessages || isSending}
              />
              <Button 
                type="submit" 
                size="icon" 
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all duration-300",
                  "bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 hover:from-sky-500 hover:via-blue-600 hover:to-sky-700",
                  "shadow-lg shadow-sky-400/50 hover:shadow-xl hover:shadow-sky-500/60 hover:scale-110 hover:rotate-12",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0",
                  "glow-effect"
                )}
                disabled={!messageText.trim() || !canSendMessages || isSending}
              >
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 text-white" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </div>
        </form>
      </footer>

      {/* Diálogo de perfil del usuario */}
      <UserProfileDialog
        open={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        user={{
          uid: otherParticipant?.id || '',
          displayName: otherUserDisplayName,
          photoURL: otherUserPhotoURL,
          email: otherParticipant?.email || null,
          pin: undefined,
          bio: otherParticipant?.bio || undefined,
        }}
      />
    </div>
  );
}
