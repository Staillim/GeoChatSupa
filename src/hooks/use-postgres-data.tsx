/**
 * Custom hooks to replace Firestore hooks
 * Uses PostgreSQL via API routes instead of Firestore
 */

import useSWR from 'swr';
import { fetcher, postData, putData, deleteData } from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  lat?: number | null;
  lng?: number | null;
  location_sharing_requests?: string[];
  location_sharing_with?: string[];
  is_online?: boolean;
  created_at?: string;
  updated_at?: string;
  last_seen?: string;
  // Firebase Auth compatibility fields
  uid?: string;
  displayName?: string;
  photoURL?: string | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  created_by: string;
  status: 'pending' | 'active' | 'blocked';
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  sender_id: string;
  text: string;
  image_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  read?: boolean;
  read_at?: string | null;
  created_at?: string;
}

export interface LiveLocation {
  id: string;
  user_id: string;
  shared_with: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  is_active?: boolean;
  started_at?: string;
  last_updated?: string;
  // Fields for display
  userName?: string;
  userPhoto?: string | null;
  lastUpdated?: { toDate: () => Date };
}

// ============================================================================
// USER HOOKS
// ============================================================================

/**
 * Hook to get a single user by ID (for getting other users' data)
 * Renamed from useUser to avoid conflict
 */
export function useUserData(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>(
    userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Transform to add Firebase Auth compatibility
  const user = data?.user ? {
    ...data.user,
    uid: data.user.id,
    displayName: data.user.name,
    photoURL: data.user.avatar
  } : null;

  return {
    user,
    isLoading,
    isError: error,
    mutate
  };
}

/**
 * Hook to get all users (replaces useCollection('users'))
 * Renamed from useUsers to useAllUsers for clarity
 */
export function useAllUsers(options?: {
  online?: boolean;
  lat?: number;
  lng?: number;
  radius?: number; // in km
}) {
  const params = new URLSearchParams();
  if (options?.online !== undefined) params.append('online', String(options.online));
  if (options?.lat !== undefined) params.append('lat', String(options.lat));
  if (options?.lng !== undefined) params.append('lng', String(options.lng));
  if (options?.radius !== undefined) params.append('radius', String(options.radius));

  const { data, error, isLoading, mutate } = useSWR<{ users: User[]; total: number }>(
    `/api/users?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false
    }
  );

  // Transform users to add Firebase Auth compatibility fields
  const users = (data?.users || []).map((user: User) => ({
    ...user,
    uid: user.id,
    displayName: user.name,
    photoURL: user.avatar
  }));

  return {
    users,
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate
  };
}

// ============================================================================
// CONVERSATION HOOKS
// ============================================================================

/**
 * Hook to get conversations for a user
 * Replaces: useCollection with query on conversations
 */
export function useConversations(userId: string | undefined, status?: 'pending' | 'active' | 'blocked') {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (status) params.append('status', status);

  const { data, error, isLoading, mutate } = useSWR<{ conversations: Conversation[]; count: number }>(
    userId ? `/api/conversations?${params.toString()}` : null,
    fetcher,
    {
      refreshInterval: 5000 // Refresh every 5 seconds for chat updates
    }
  );

  return {
    conversations: data?.conversations || [],
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate
  };
}

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

/**
 * Hook to get messages for a conversation
 * Replaces: useCollection('messages') with orderBy
 */
export function useMessages(conversationId: string | undefined, options?: { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));

  const { data, error, isLoading, mutate } = useSWR<{ messages: Message[]; total: number }>(
    conversationId ? `/api/conversations/${conversationId}/messages?${params.toString()}` : null,
    fetcher,
    {
      refreshInterval: 3000 // Refresh every 3 seconds for real-time feel
    }
  );

  return {
    messages: data?.messages || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate
  };
}

// ============================================================================
// LIVE LOCATION HOOKS
// ============================================================================

/**
 * Hook to get live locations for a user (both sharing and received)
 * Replaces: useAllLiveLocations
 */
export function useLiveLocations(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ liveLocations: LiveLocation[]; count: number }>(
    userId ? `/api/live-locations?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds for real-time feel
      revalidateOnFocus: true
    }
  );

  // Transform to match Firebase format
  const liveLocations = (data?.liveLocations || []).map((loc: LiveLocation) => ({
    ...loc,
    userId: loc.user_id,
    sharedWith: loc.shared_with,
    isActive: loc.is_active,
    lastUpdated: loc.last_updated ? {
      toDate: () => new Date(loc.last_updated!)
    } : { toDate: () => new Date() }
  }));

  return {
    liveLocations,
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate
  };
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Mutation: Create a new user
 */
export async function createUser(user: Omit<User, 'created_at' | 'updated_at'>) {
  try {
    const response = await postData('/api/users', user);
    return { success: true, user: response.user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Update user fields (location, online status, etc)
 */
export async function updateUser(userId: string, fields: Partial<User>) {
  try {
    const response = await putData(`/api/users/${userId}`, fields);
    return { success: true, user: response.user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Create a conversation
 */
export async function createConversation(data: {
  id: string;
  participants: string[];
  created_by: string;
  initialMessage?: string;
}) {
  try {
    const response = await postData('/api/conversations', data);
    return { success: true, conversation: response.conversation };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Send a message
 */
export async function sendMessage(conversationId: string, message: Omit<Message, 'created_at'>) {
  try {
    const response = await postData(`/api/conversations/${conversationId}/messages`, message);
    return { success: true, message: response.message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Start sharing live location
 */
export async function startLiveLocationSharing(data: {
  user_id: string;
  shared_with: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}) {
  try {
    const response = await postData('/api/live-locations', data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error starting live location:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Update live location
 */
export async function updateLiveLocation(data: {
  user_id: string;
  shared_with: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}) {
  try {
    const response = await putData('/api/live-locations', data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error updating live location:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Stop sharing live location
 */
export async function stopLiveLocationSharing(userId: string, sharedWith: string) {
  try {
    const response = await deleteData(`/api/live-locations?userId=${userId}&sharedWith=${sharedWith}`);
    return { success: true, data: response };
  } catch (error) {
    console.error('Error stopping live location:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Update location sharing permissions
 */
export async function updateLocationSharingWith(userId: string, sharedWith: string[]) {
  try {
    const response = await putData(`/api/users/${userId}`, {
      location_sharing_with: sharedWith
    });
    return { success: true, user: response.user };
  } catch (error) {
    console.error('Error updating location sharing:', error);
    return { success: false, error };
  }
}

/**
 * Mutation: Update location sharing requests
 */
export async function updateLocationSharingRequests(userId: string, requests: string[]) {
  try {
    const response = await putData(`/api/users/${userId}`, {
      location_sharing_requests: requests
    });
    return { success: true, user: response.user };
  } catch (error) {
    console.error('Error updating location requests:', error);
    return { success: false, error };
  }
}
