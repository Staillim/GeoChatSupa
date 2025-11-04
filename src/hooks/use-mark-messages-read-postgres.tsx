'use client';
import { query } from '@/lib/db';

export function useMarkMessagesRead() {
  const markMessagesRead = async (conversationId: string, userId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/messages/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return { markMessagesRead };
}
