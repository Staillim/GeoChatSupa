/**
 * PostgreSQL Hook: use-send-chat-request-postgres
 * Send chat requests to other users
 */

import { useState } from 'react';
import { useUser } from './use-postgres-user';
import { postData } from '@/lib/api-client';

/**
 * Custom hook for sending chat requests to other users.
 */
export function useSendChatRequest() {
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUser) {
      setError('Debes iniciar sesión para enviar solicitudes');
      return false;
    }

    if (toUserId === currentUser.uid) {
      setError('No puedes enviarte una solicitud a ti mismo');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📤 Sending chat request to:', toUserId);

      // Create conversation first
      const conversationId = `conv_${currentUser.uid}_${toUserId}_${Date.now()}`;
      
      const conversationResult = await postData('/api/conversations', {
        id: conversationId,
        participants: [currentUser.uid, toUserId],
        created_by: currentUser.uid,
        status: 'pending',
      });

      if (!conversationResult.success) {
        throw new Error('Error al crear la conversación');
      }

      // Then create chat request
      const requestResult = await postData('/api/chat-requests', {
        id: `req_${currentUser.uid}_${toUserId}_${Date.now()}`,
        fromUserId: currentUser.uid,
        toUserId,
        conversationId,
        status: 'pending',
      });

      if (requestResult.success) {
        console.log('✅ Chat request sent successfully');
        setSuccess(true);
        return true;
      } else {
        throw new Error('Error al enviar la solicitud');
      }
    } catch (err: any) {
      console.error('❌ Error sending chat request:', err);
      
      // Check for specific errors
      if (err.message?.includes('already exists') || err.message?.includes('23505')) {
        setError('Ya existe una conversación con este usuario');
      } else {
        setError('Error al enviar la solicitud. Intenta de nuevo.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendRequest,
    loading,
    error,
    success,
  };
}
