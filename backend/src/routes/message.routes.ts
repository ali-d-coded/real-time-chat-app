// routes/message.routes.ts
import { Router } from 'express';
import { createConversationIfNotExists, createGroupConversation, getAllCampaignMessages, getConversations, getMessages } from '../controllers/message.controller';

const messageRoutes = Router();

// GET /api/conversations
messageRoutes.get('/conversations/all', getConversations);

// GET /api/messages/:conversationId?page=1
messageRoutes.get('/conversations/:conversationId', getMessages); // Only match valid ObjectId

// POST /api/messages/start
messageRoutes.post('/start', createConversationIfNotExists);

// POST /api/messages/group
messageRoutes.post('/group', createGroupConversation);

// GET /api/messages/campaigns/all
messageRoutes.get('/campaigns/all', getAllCampaignMessages);

export default messageRoutes;