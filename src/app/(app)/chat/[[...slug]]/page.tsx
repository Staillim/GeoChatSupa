'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useMessages } from '@/hooks/use-messages-postgres';
import { useUser } from '@/hooks/use-postgres-user';
import { useConversation } from '@/hooks/use-conversation-postgres';
import { useMarkAsRead } from '@/hooks/use-mark-as-read-postgres';
import { useMarkMessagesRead } from '@/hooks/use-mark-messages-read-postgres';
import { useEffect, useRef, useState } from 'react';
import { CheckCheck, MapPin, ExternalLink } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocationPreviewMap } from '@/components/location-preview-map';
import { useRouter } from 'next/navigation';
import { useSharedLocation } from '@/hooks/use-shared-location-store';

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const { markAsRead } = useMarkAsRead();
  const { markMessagesRead } = useMarkMessagesRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const { setSharedLocation } = useSharedLocation();

  // Obtener la conversación
  const { conversation, isLoading: isConversationLoading } = useConversation(conversationId || null);
  
  // Obtener los mensajes (pasando currentUserId para notificaciones)
  const { messages, isLoading: isMessagesLoading } = useMessages(conversationId, user?.uid);

  // Auto-scroll mejorado - detecta mensajes nuevos
  useEffect(() => {
    if (messages && messages.length > 0) {
      const isNewMessage = messages.length > previousMessageCountRef.current;
      previousMessageCountRef.current = messages.length;

      if (isNewMessage) {
        // Usar setTimeout para asegurar que el DOM se actualice
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [messages]);

  // Scroll inicial cuando se cargan los mensajes por primera vez
  useEffect(() => {
    if (!isMessagesLoading && messages && messages.length > 0 && previousMessageCountRef.current === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
      }, 100);
    }
  }, [isMessagesLoading, messages]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (conversationId && user?.uid && conversation) {
      const unreadCount = conversation.unread_count?.[user.uid] || 0;
      if (unreadCount > 0) {
        // Marcar el contador de conversación como leído
        markAsRead(conversationId, user.uid);
      }
    }
  }, [conversationId, user?.uid, conversation, markAsRead]);

  // Marcar mensajes individuales como leídos cuando hay mensajes
  useEffect(() => {
    if (conversationId && user?.uid && messages && messages.length > 0) {
      // Marcar todos los mensajes del otro usuario como leídos
      markMessagesRead(conversationId, user.uid);
    }
  }, [conversationId, user?.uid, messages, markMessagesRead]);

  // Función para manejar click en ubicación compartida
  const handleLocationClick = (message: any) => {
    if (!message.location_lat || !message.location_lng) return;
    
    // Guardar la ubicación compartida en el store
    setSharedLocation({
      latitude: Number(message.location_lat),
      longitude: Number(message.location_lng),
      timestamp: message.created_at || new Date().toISOString(),
      duration: undefined,
      senderName: message.sender_name || 'Usuario',
      senderPhotoURL: message.sender_avatar || '',
    });
    
    // Navegar al mapa
    router.push('/map');
  };

  if (!conversationId) {
    return null;
  }

  if (isConversationLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando conversación...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversación no encontrada</p>
      </div>
    );
  }

  return (
    <div className="px-1 md:px-2 py-4 space-y-4">
            {isMessagesLoading ? (
              <div className="text-center text-muted-foreground">
                <p>Cargando mensajes...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <p>No hay mensajes aún</p>
                <p className="text-sm mt-2">Sé el primero en enviar un mensaje</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isSender = message.sender_id === user?.uid;
                  const senderName = isSender ? 'Tú' : (message.sender_name || 'Usuario');
                  const isLastMessage = index === messages.length - 1;

                  return (
                  <div 
                    key={message.id} 
                    className={cn(
                      'flex items-end gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 group relative',
                      isSender ? 'justify-end' : 'justify-start'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                      {/* Icono flotante para último mensaje recibido - FUERA del contenedor del mensaje */}
                      {isLastMessage && !isSender && (
                        <div className="absolute -top-3 left-12 z-20">
                          <div className="relative">
                            <Sparkles className="h-6 w-6 text-sky-500 dark:text-sky-400 animate-bounce drop-shadow-lg" />
                            <div className="absolute inset-0 bg-sky-400/40 rounded-full blur-md animate-pulse" />
                          </div>
                        </div>
                      )}
                      
                      {!isSender && (
                      <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 ring-2 ring-white dark:ring-slate-800 shadow-lg shadow-sky-300/30 dark:shadow-sky-800/30">
                          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-semibold">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      )}
                      <div
                      className={cn(
                          'max-w-[90%] md:max-w-[75%] rounded-2xl p-3 text-sm relative overflow-hidden group/message shimmer-effect',
                          'transition-all duration-300 hover:scale-[1.02]',
                          isSender
                          ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 text-white shadow-lg shadow-sky-400/40 hover:shadow-xl hover:shadow-sky-500/50 hover:from-sky-500 hover:via-blue-600 hover:to-sky-700'
                          : 'bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-800 dark:to-sky-950/50 border-2 border-sky-200 dark:border-sky-800 shadow-md hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 backdrop-blur-sm'
                      )}
                      >
                      
                      {/* Shimmer effect para mensajes */}
                      <div className="absolute inset-0 opacity-0 group-hover/message:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </div>
                      
                      {/* Orbes flotantes en hover - colores azules */}
                      <div className="absolute -top-2 -right-2 w-16 h-16 bg-sky-300/30 dark:bg-sky-500/30 rounded-full blur-xl opacity-0 group-hover/message:opacity-100 transition-opacity duration-300 pointer-events-none floating-orb" />
                      <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-blue-300/20 dark:bg-blue-500/20 rounded-full blur-lg opacity-0 group-hover/message:opacity-100 transition-opacity duration-500 pointer-events-none floating-orb" style={{ animationDelay: '0.5s' }} />
                      
                      {/* Contenido del mensaje según el tipo */}
                      {message.image_url ? (
                        <div className="space-y-2">
                          <img
                            src={message.image_url}
                            alt="Imagen compartida"
                            className="max-w-full w-auto max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain"
                            onClick={() => setSelectedImage(message.image_url!)}
                          />
                          <p className="text-xs opacity-80">📷 Imagen</p>
                        </div>
                      ) : message.location_lat && message.location_lng ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <p className="font-medium text-sm">Ubicación compartida</p>
                          </div>
                          
                          {/* Mini mapa preview */}
                          <LocationPreviewMap
                            latitude={Number(message.location_lat)}
                            longitude={Number(message.location_lng)}
                            onClick={() => handleLocationClick(message)}
                          />
                          
                          <p className="text-xs opacity-70 font-mono">
                            {Number(message.location_lat).toFixed(6)}, {Number(message.location_lng).toFixed(6)}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "flex-1 h-8 text-xs",
                                isSender
                                  ? "hover:bg-white/20 text-white"
                                  : "hover:bg-sky-100 dark:hover:bg-sky-900/50"
                              )}
                              onClick={() => handleLocationClick(message)}
                            >
                              <MapPin className="h-3 w-3 mr-1.5" />
                              Ver en mapa
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "flex-1 h-8 text-xs",
                                isSender
                                  ? "hover:bg-white/20 text-white"
                                  : "hover:bg-sky-100 dark:hover:bg-sky-900/50"
                              )}
                              onClick={() => {
                                const url = `https://www.openstreetmap.org/?mlat=${Number(message.location_lat)}&mlon=${Number(message.location_lng)}&zoom=15`;
                                window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Abrir externo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="break-words relative z-10 leading-relaxed">{message.text}</p>
                      )}
                      
                      <p className={cn(
                        "text-xs mt-1 relative z-10 flex items-center gap-1.5",
                        isSender ? 'text-white/80 justify-end' : 'text-muted-foreground'
                      )}>
                        <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                        {/* Indicadores de lectura tipo WhatsApp - solo para mensajes enviados */}
                        {isSender && (
                          <span className="flex items-center">
                            {message.read ? (
                              // Doble check azul cuando está leído
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5 transition-colors duration-300",
                                "text-sky-200 dark:text-sky-300"
                              )} />
                            ) : (
                              // Doble check blanco cuando está enviado pero no leído
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5",
                                "text-white/60"
                              )} />
                            )}
                          </span>
                        )}
                      </p>
                      </div>
                      {isSender && (
                      <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 ring-2 ring-white dark:ring-slate-800 shadow-lg shadow-sky-300/30 dark:shadow-sky-800/30">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white font-semibold">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      )}
                  </div>
                  );
                })}
                {/* Elemento invisible para auto-scroll */}
                <div ref={messagesEndRef} />
              </>
            )}

      {/* Diálogo para ver imagen en tamaño completo */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Imagen en tamaño completo"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
