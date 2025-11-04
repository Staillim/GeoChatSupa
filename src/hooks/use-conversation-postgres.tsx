'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api-client';

export interface Conversation {
  id: string;
  participants: string[];
  created_at: string;
  last_message: string | null;
  last_message_time: string | null;
  created_by: string;
  unread_count?: Record<string, number>;
}

export function useConversation(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Conversation>(
    conversationId ? `/api/conversations/${conversationId}` : null,
    fetcher,
    {
      refreshInterval: 3000, // Refresh every 3s
      revalidateOnFocus: true,
    }
  );

  return {
    conversation: data,
    isLoading,
    error,
    mutate,
  };
}
