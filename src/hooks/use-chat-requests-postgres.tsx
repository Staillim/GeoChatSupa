/**
 * PostgreSQL Hook: use-chat-requests-postgres
 * Manages chat requests functionality
 */

import useSWR from 'swr';
import { fetcher, postData, putData, deleteData } from '@/lib/api-client';

export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

/**
 * Get chat requests for a user
 */
export function useChatRequests(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    requests: ChatRequest[];
  }>(
    userId ? `/api/chat-requests?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    requests: data?.requests || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Accept a chat request
 */
export function useAcceptChatRequest() {
  const acceptRequest = async (requestId: string, conversationId: string) => {
    try {
      const result = await putData(`/api/chat-requests/${requestId}`, {
        status: 'accepted',
      });

      if (result.success) {
        // Also update conversation status
        await putData(`/api/conversations/${conversationId}`, {
          status: 'active',
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error accepting chat request:', error);
      return false;
    }
  };

  return { acceptRequest };
}

/**
 * Reject a chat request
 */
export function useRejectChatRequest() {
  const rejectRequest = async (requestId: string) => {
    try {
      const result = await putData(`/api/chat-requests/${requestId}`, {
        status: 'rejected',
      });

      return result.success;
    } catch (error) {
      console.error('Error rejecting chat request:', error);
      return false;
    }
  };

  return { rejectRequest };
}

/**
 * Send a chat request
 */
export function useSendChatRequest() {
  const sendRequest = async (
    fromUserId: string,
    toUserId: string,
    conversationId: string
  ) => {
    try {
      const result = await postData('/api/chat-requests', {
        id: `${fromUserId}_${toUserId}_${Date.now()}`,
        fromUserId,
        toUserId,
        conversationId,
        status: 'pending',
      });

      return result.success;
    } catch (error) {
      console.error('Error sending chat request:', error);
      return false;
    }
  };

  return { sendRequest };
}
