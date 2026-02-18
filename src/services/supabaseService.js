// services/supabaseService.js
import { supabase } from './supabase';

// Profiles service
export const profilesService = {
  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all profiles (for discover)
  async getProfiles(excludeUserId, filters = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', excludeUserId)
      .eq('onboarding_complete', true)
      .eq('banned', false);
    
    // Apply filters
    if (filters.level) {
      query = query.eq('life->>level', filters.level);
    }
    
    if (filters.location) {
      query = query.eq('location->>based', filters.location);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Search users
  async searchUsers(query) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,alias.ilike.%${query}%`)
      .eq('onboarding_complete', true)
      .eq('banned', false);
    
    if (error) throw error;
    return data;
  }
};

// Ripen (likes) service
export const ripenService = {
  // Add a ripen
  async addRipen(userId, targetUserId) {
    const { data, error } = await supabase
      .from('ripen_history')
      .insert({
        user_id: userId,
        target_user_id: targetUserId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's ripen history (who they've liked)
  async getRipenHistory(userId) {
    const { data, error } = await supabase
      .from('ripen_history')
      .select('target_user_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(item => item.target_user_id);
  },

  // Check if mutual match exists
  async checkMutualMatch(userId, targetUserId) {
    const { data, error } = await supabase
      .from('ripen_history')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('target_user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }
};

// Chat service
export const chatService = {
  // Get or create chat room
  async getOrCreateChatRoom(userId1, userId2) {
    const roomId = [userId1, userId2].sort().join('_');
    
    // Try to get existing room
    let { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
      // Create new room
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          id: roomId,
          participants: [userId1, userId2]
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return newRoom;
    }
    
    return data;
  },

  // Send message
  async sendMessage(chatRoomId, senderId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_id: senderId,
        content,
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update chat room last message
    await supabase
      .from('chat_rooms')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', chatRoomId);
    
    return data;
  },

  // Get messages for chat room
  async getMessages(chatRoomId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get user's chat rooms
  async getUserChatRooms(userId) {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .contains('participants', [userId])
      .order('last_message_at', { ascending: false, nullsLast: true });
    
    if (error) throw error;
    return data;
  },

  // Mark messages as read
  async markMessagesAsRead(chatRoomId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_room_id', chatRoomId)
      .neq('sender_id', userId)
      .eq('read', false);
    
    if (error) throw error;
  }
};

// Notifications service
export const notificationsService = {
  // Get user notifications
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  // Create notification
  async createNotification(userId, type, message) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message
      });
    
    if (error) throw error;
  }
};

// Ads service
export const adsService = {
  // Get active ads
  async getActiveAds() {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        business:business_id (
          name,
          alias,
          photo_url
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create ad (for businesses)
  async createAd(businessId, adData) {
    const { data, error } = await supabase
      .from('ads')
      .insert({
        business_id: businessId,
        ...adData,
        active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Admin service
export const adminService = {
  // Ban user
  async banUser(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ banned: true })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Delete user
  async deleteUser(userId) {
    // This will cascade due to foreign key constraints
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Grant premium
  async grantPremium(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription: {
          isPremium: true,
          dailyUnripes: 100,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Revoke premium
  async revokePremium(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription: {
          isPremium: false,
          dailyUnripes: 25,
          expiresAt: null
        }
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Get stats
  async getStats() {
    try {
      const { count: totalUsers, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: premiumUsers, error: premiumError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .filter('subscription->>isPremium', 'eq', 'true');
      
      const { count: bannedUsers, error: bannedError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('banned', true);
      
      if (userError || premiumError || bannedError) {
        throw userError || premiumError || bannedError;
      }
      
      return {
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        bannedUsers: bannedUsers || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalUsers: 0,
        premiumUsers: 0,
        bannedUsers: 0
      };
    }
  }
};

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to messages
  subscribeToMessages(chatRoomId, callback) {
    return supabase
      .channel(`chat:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },

  // Subscribe to notifications
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },

  // Subscribe to profile updates
  subscribeToProfile(userId, callback) {
    return supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  }
};