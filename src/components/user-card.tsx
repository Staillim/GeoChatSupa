"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, Check, X } from "lucide-react";
import { useSendChatRequest } from "@/hooks/use-send-chat-request-postgres";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  pin?: string;
}

interface UserCardProps {
  user: SearchUser;
  onRequestSent?: () => void;
}

/**
 * Card component displaying user information with option to send chat request.
 */
export function UserCard({ user, onRequestSent }: UserCardProps) {
  const { sendRequest, loading, error, success } = useSendChatRequest();
  const [requestSent, setRequestSent] = useState(false);

  const handleSendRequest = async () => {
    const result = await sendRequest(user.id);
    if (result) {
      setRequestSent(true);
      setTimeout(() => {
        onRequestSent?.();
      }, 1500);
    }
  };

  const displayName = user.name || user.email || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || ''} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>PIN: {user.pin || "N/A"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && requestSent && (
          <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>¡Solicitud enviada exitosamente!</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSendRequest}
          disabled={loading || requestSent}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : requestSent ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Solicitud Enviada
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
