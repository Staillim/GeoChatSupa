'use client';
import { putData } from '@/lib/api-client';

export function useMarkAsRead() {
  const markAsRead = async (conversationId: string, userId: string) => {
    try {
      // Get current conversation to update unread_count
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) return;
      
      const conversation = await response.json();
      const unreadCount = conversation.unread_count || {};
      unreadCount[userId] = 0;

      await putData(`/api/conversations/${conversationId}`, {
        unread_count: unreadCount,
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  return { markAsRead };
}
