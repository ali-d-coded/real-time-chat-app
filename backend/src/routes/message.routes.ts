// routes/message.routes.ts
import { Router } from 'express';
import { createConversationIfNotExists, createGroupConversation, getConversations, getMessages } from '../controllers/message.controller';

const messageRoutes = Router();

// GET /api/conversations
messageRoutes.get('/conversations/all', getConversations);

// GET /api/messages/:conversationId?page=1
messageRoutes.get('/conversations/:conversationId', getMessages); // Only match valid ObjectId

// POST /api/messages/start
messageRoutes.post('/start', createConversationIfNotExists);

// POST /api/messages/group
messageRoutes.post('/group', createGroupConversation);

// PATCH /api/messages/:conversationId
messageRoutes.patch('/conversations/:conversationId', (req, res) => {
  // Handle updating a conversation
});

export default messageRoutes;