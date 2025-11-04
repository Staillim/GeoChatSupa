'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api-client';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read: boolean;
  image_url?: string;
  location_lat?: number;
  location_lng?: number;
  sender_name?: string;
  sender_avatar?: string;
}

interface MessagesResponse {
  success: boolean;
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
}

export function useMessages(conversationId: string | null | undefined, currentUserId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    fetcher,
    {
      refreshInterval: 2000, // Refresh every 2s
      revalidateOnFocus: true,
    }
  );

  return {
    messages: data?.messages || [],
    isLoading,
    error,
    mutate,
  };
}
