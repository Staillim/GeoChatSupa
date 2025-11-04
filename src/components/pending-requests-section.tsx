"use client";

import { useChatRequests, useAcceptChatRequest, useRejectChatRequest } from '@/hooks/use-chat-requests-postgres';
import { useUser } from '@/hooks/use-postgres-user';
import { useUserData } from '@/hooks/use-postgres-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface RequestItemProps {
  request: {
    id: string;
    fromUserId: string;
    conversationId: string;
  };
}

function RequestItem({ request }: RequestItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { acceptRequest } = useAcceptChatRequest();
  const { rejectRequest } = useRejectChatRequest();

  // Obtener datos del usuario que envió la solicitud
  const { user: fromUser, isLoading } = useUserData(request.fromUserId);

  const displayName = fromUser?.name || fromUser?.email?.split('@')[0] || 'Usuario';
  const photoURL = fromUser?.avatar || null;
  const initials = displayName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const success = await acceptRequest(request.id, request.conversationId);
      if (success) {
        console.log('✅ Solicitud aceptada');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const success = await rejectRequest(request.id);
      if (success) {
        console.log('✅ Solicitud rechazada');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shimmer-effect hover-lift overflow-hidden group bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/50">
      {/* Orbes flotantes */}
      <div className="absolute -top-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 floating-orb" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 floating-orb" style={{ animationDelay: '1s' }} />
      
      <CardContent className="p-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Avatar className="h-10 w-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10 ring-2 ring-background shadow-md">
              <AvatarImage src={photoURL || ''} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Indicador animado */}
            <div className="absolute -top-0.5 -right-0.5 z-20">
              <div className="relative h-3 w-3 bg-green-500 rounded-full border-2 border-background">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors duration-300">{displayName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              Quiere chatear contigo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 hover:text-green-800 dark:from-green-950/50 dark:to-emerald-950/50 dark:text-green-400 dark:hover:from-green-900/50 dark:hover:to-emerald-900/50 transition-all duration-300 hover:scale-110 hover:rotate-12 shadow-md hover:shadow-lg"
              onClick={handleAccept}
              disabled={isProcessing}
              title="Aceptar solicitud"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-gradient-to-br from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 hover:text-red-800 dark:from-red-950/50 dark:to-pink-950/50 dark:text-red-400 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 transition-all duration-300 hover:scale-110 hover:rotate-12 shadow-md hover:shadow-lg"
              onClick={handleReject}
              disabled={isProcessing}
              title="Rechazar solicitud"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Component that displays pending chat requests.
 * Shows a list of users who want to chat with the current user.
 */
export function PendingRequestsSection() {
  const { user } = useUser();
  const { requests, isLoading } = useChatRequests(user?.uid);

  if (isLoading || !requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10 p-4 relative overflow-hidden">
      {/* Orbe de fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
      
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 relative z-10">
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Solicitudes Pendientes
        </span>
        <span className="bg-gradient-to-br from-primary to-accent text-white text-xs rounded-full px-2.5 py-1 shadow-lg shadow-primary/30 animate-pulse">
          {requests.length}
        </span>
      </h3>
      <div className="space-y-2 relative z-10">
        {requests.map((request, index) => (
          <div
            key={request.id}
            className="animate-in slide-in-from-left-2 fade-in duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <RequestItem request={request} />
          </div>
        ))}
      </div>
    </div>
  );
}
