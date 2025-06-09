// Enhanced online status management with better error handling and race condition prevention

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

// Enhanced type definitions
interface ServerToClientEvents {
  receive_message: (message: any) => void;
  user_online: (data: { id: string }) => void;
  user_offline: (data: { id: string }) => void;
  error: (error: { message: string }) => void;
  message_delivered: (data: { messageId: string }) => void;
}

interface ClientToServerEvents {
  send_message: (data: { conversationId: string; content: string }) => void;
  join_conversation: (data: { conversationId: string }) => void;
  leave_conversation: (data: { conversationId: string }) => void;
  heartbeat: () => void; // Add heartbeat for connection health
}

interface ISocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: { id: string; username?: string };
}

// Track active connections per user to handle multiple sessions
const userConnections = new Map<string, Set<string>>();

// Add a lock mechanism to prevent race conditions
const userStatusLocks = new Map<string, Promise<void>>();

// Helper function to safely update user online status
const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  // Prevent race conditions by using a lock per user
  const existingLock = userStatusLocks.get(userId);
  if (existingLock) {
    await existingLock;
  }

  const updatePromise = (async () => {
    try {
      console.log(`🔄 Updating user ${userId} online status to: ${isOnline}`);
      
      const updateResult = await User.findByIdAndUpdate(
        userId, 
        { 
          isOnline, 
          lastSeen: new Date() 
        },
        { new: true } // Return the updated document
      );

      if (!updateResult) {
        console.error(`❌ Failed to update user ${userId} - user not found`);
        return;
      }

      console.log(`✅ Successfully updated user ${userId} online status to: ${isOnline}`);
    } catch (error) {
      console.error(`❌ Database error updating user ${userId} online status:`, error);
      throw error;
    }
  })();

  userStatusLocks.set(userId, updatePromise);
  
  try {
    await updatePromise;
  } finally {
    userStatusLocks.delete(userId);
  }
};

// Cleanup stale connections on server start
const cleanupStaleConnections = async (): Promise<void> => {
  try {
    console.log('🧹 Cleaning up stale online statuses...');
    await User.updateMany({}, { isOnline: false, lastSeen: new Date() });
    console.log('✅ Stale connections cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up stale connections:', error);
  }
};

export const setupSocket = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("🔧 Socket.IO server setup initiated");
  
  // Clean up stale connections on server start
  cleanupStaleConnections();
  
  // Enhanced debugging for connection attempts
  io.engine.on("connection_error", (err) => {
    console.log("❌ Connection error:", err.req);
    console.log("❌ Error code:", err.code);
    console.log("❌ Error message:", err.message);
    console.log("❌ Error context:", err.context);
  });

  // Authentication middleware with better error handling
  io.use(async (socket: ISocket, next) => {
    console.log("🔐 Authentication middleware triggered");
    console.log("🔍 Socket handshake auth:", socket.handshake.auth);
    console.log("🔍 Socket handshake query:", socket.handshake.query);
    
    try {
      // Check multiple possible token locations
      const token = socket.handshake.auth.token || 
                   socket.handshake.query.token ||
                   socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      console.log("🎫 Token found:", !!token);
      
      if (!token) {
        console.log("❌ No token provided");
        return next(new Error('Authentication token required'));
      }

      console.log("🔓 Verifying JWT token...");
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log("✅ Token decoded successfully:", { id: decoded.id });
      
      if (!decoded.id) {
        console.log("❌ Invalid token payload - no user ID");
        return next(new Error('Invalid token payload'));
      }

      console.log("👤 Looking up user in database...");
      
      // Verify user exists and is active
      const user = await User.findById(decoded.id).select('_id username isActive');
      if (!user) {
        console.log("❌ User not found in database");
        return next(new Error('User not found or inactive'));
      }

      console.log("✅ User authenticated:", { id: user._id, username: user.username });
      
      socket.user = { id: decoded.id, username: user.username };
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new Error('Invalid JWT token'));
      } else if (error instanceof jwt.TokenExpiredError) {
        return next(new Error('JWT token expired'));
      }
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: ISocket) => {
    console.log("NEW CONNECTION ESTABLISHED!");
    console.log("🔌 Socket ID:", socket.id);
    
    const userId = socket.user?.id;
    if (!userId) {
      console.log("❌ No user ID found on socket - this should not happen");
      return;
    }

    console.log(`👤 User connected: ${userId} (Socket: ${socket.id})`);

    try {
      // Track user connections for handling multiple sessions
      const wasOffline = !userConnections.has(userId);
      
      if (wasOffline) {
        userConnections.set(userId, new Set());
        console.log("🟢 Setting user online for first connection");
        
        // Set user online only on first connection
        await updateUserOnlineStatus(userId, true);
        socket.broadcast.emit('user_online', { id: userId });
      }
      
      userConnections.get(userId)!.add(socket.id);
      console.log(`📊 User ${userId} now has ${userConnections.get(userId)?.size} active connections`);

      // Join all conversations of this user
      console.log("🔍 Finding user conversations...");
      const conversations = await Conversation.find({ 
        participants: { $in: [userId] } 
      }).select('_id');
      
      console.log(`📱 Found ${conversations.length} conversations for user`);
      
      const roomJoinPromises = conversations.map(async (convo) => {
        try {
          await socket.join(convo.id.toString());
          console.log(`✅ User ${userId} joined room: ${convo._id}`);
        } catch (error) {
          console.error(`❌ Failed to join room ${convo._id}:`, error);
        }
      });
      
      await Promise.allSettled(roomJoinPromises);
      console.log("✅ Finished joining all conversation rooms");

      // Add heartbeat mechanism
      socket.on('heartbeat', () => {
        console.log(`💓 Heartbeat received from user ${userId}`);
        // Update last seen time
        updateUserOnlineStatus(userId, true).catch(error => {
          console.error(`❌ Error updating heartbeat for user ${userId}:`, error);
        });
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        console.log("📤 Send message event received:", data);
        try {
          const { conversationId, content } = data;

          // Input validation
          if (!conversationId || typeof conversationId !== 'string') {
            return socket.emit('error', { message: 'Invalid conversation ID' });
          }

          if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return socket.emit('error', { message: 'Message content cannot be empty' });
          }

          if (content.length > 1000) {
            return socket.emit('error', { message: 'Message too long (max 1000 characters)' });
          }

          // Verify conversation exists and user is a participant
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            return socket.emit('error', { message: 'Conversation not found' });
          }

          if (!conversation.participants.some(p => p.toString() === userId)) {
            return socket.emit('error', { message: 'Unauthorized: Not a participant in this conversation' });
          }

          // Create message
          const message = await Message.create({
            sender: userId,
            conversationId,
            content: content.trim(),
            timestamp: new Date()
          });

          // Populate sender information
          const populatedMsg = await message.populate('sender', '_id username avatar');

          // Update conversation with last message info
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageTime: new Date(),
            $inc: { messageCount: 1 }
          });

          // Emit to all participants in the conversation
          io.to(conversationId).emit('receive_message', populatedMsg);

          // Confirm message delivery to sender
          socket.emit('message_delivered', { messageId: message.id.toString() });

          console.log(`✅ Message sent in conversation ${conversationId} by user ${userId}`);

        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle joining specific conversations
      socket.on('join_conversation', async (data) => {
        console.log("🏠 Join conversation event received:", data);
        try {
          const { conversationId } = data;

          if (!conversationId || typeof conversationId !== 'string') {
            return socket.emit('error', { message: 'Invalid conversation ID' });
          }

          // Verify user is a participant
          const conversation = await Conversation.findById(conversationId);
          if (!conversation || !conversation.participants.some(p => p.toString() === userId)) {
            return socket.emit('error', { message: 'Unauthorized: Not a participant in this conversation' });
          }

          await socket.join(conversationId);
          console.log(`✅ User ${userId} manually joined conversation: ${conversationId}`);

        } catch (error) {
          console.error('❌ Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving specific conversations
      socket.on('leave_conversation', async (data) => {
        console.log("🚪 Leave conversation event received:", data);
        try {
          const { conversationId } = data;

          if (!conversationId || typeof conversationId !== 'string') {
            return socket.emit('error', { message: 'Invalid conversation ID' });
          }

          await socket.leave(conversationId);
          console.log(`✅ User ${userId} left conversation: ${conversationId}`);

        } catch (error) {
          console.error('❌ Error leaving conversation:', error);
          socket.emit('error', { message: 'Failed to leave conversation' });
        }
      });

    } catch (error) {
      console.error('❌ Error during socket connection setup:', error);
      socket.emit('error', { message: 'Connection setup failed' });
    }

    // Handle disconnection with improved error handling
    socket.on('disconnect', async (reason) => {
      console.log(`👋 User ${userId} disconnected: ${reason} (Socket: ${socket.id})`);

      try {
        // Remove this socket from user connections
        const userSockets = userConnections.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          
          // If no more connections for this user, set them offline
          if (userSockets.size === 0) {
            userConnections.delete(userId);
            console.log(`🔴 Setting user ${userId} offline - no more connections`);
            
            await updateUserOnlineStatus(userId, false);
            socket.broadcast.emit('user_offline', { id: userId });
            console.log(`🔴 User ${userId} is now offline`);
          } else {
            console.log(`📊 User ${userId} still has ${userSockets.size} active connections`);
          }
        }
      } catch (error) {
        console.error('❌ Error handling user disconnect:', error);
        // Even if there's an error, try to clean up the connection tracking
        try {
          const userSockets = userConnections.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              userConnections.delete(userId);
            }
          }
        } catch (cleanupError) {
          console.error('❌ Error during cleanup:', cleanupError);
        }
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${userId}:`, error);
    });

  });

  // Handle server-level errors
  io.on('error', (error) => {
    console.error('❌ Socket.IO server error:', error);
  });

  // Set up periodic cleanup for stale connections
  const cleanupInterval = setInterval(async () => {
    try {
      console.log('🧹 Running periodic cleanup...');
      
      // Check for users who should be offline but aren't
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const staleUsers = await User.find({
        isOnline: true,
        lastSeen: { $lt: fiveMinutesAgo }
      }).select('_id');

      if (staleUsers.length > 0) {
        console.log(`🧹 Found ${staleUsers.length} stale online users`);
        await User.updateMany(
          { _id: { $in: staleUsers.map(u => u._id) } },
          { isOnline: false }
        );
      }
    } catch (error) {
      console.error('❌ Error during periodic cleanup:', error);
    }
  }, 2 * 60 * 1000); // Run every 2 minutes

  // Store cleanup interval for graceful shutdown
  (io as any).cleanupInterval = cleanupInterval;

  console.log("✅ Socket.IO server setup completed");
};

// Enhanced cleanup function for graceful shutdown
export const cleanupSocket = async (io?: Server) => {
  console.log('🧹 Cleaning up socket connections...');
  
  // Clear periodic cleanup interval
  if (io && (io as any).cleanupInterval) {
    clearInterval((io as any).cleanupInterval);
  }
  
  // Set all tracked users offline with better error handling
  const offlinePromises = Array.from(userConnections.keys()).map(async (userId) => {
    try {
      await updateUserOnlineStatus(userId, false);
    } catch (error) {
      console.error(`❌ Error setting user ${userId} offline during cleanup:`, error);
    }
  });
  
  await Promise.allSettled(offlinePromises);
  userConnections.clear();
  userStatusLocks.clear();
  
  console.log('✅ Socket cleanup completed');
};