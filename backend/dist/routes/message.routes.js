"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const message_controller_1 = require("../controllers/message.controller");
const messageRoutes = (0, express_1.Router)();
// GET /api/messages/:conversationId?page=1
messageRoutes.get('/:conversationId', authMiddleware_1.authMiddleware, message_controller_1.getMessages);
// POST /api/messages/start
messageRoutes.post('/start', authMiddleware_1.authMiddleware, message_controller_1.createConversationIfNotExists);
exports.default = messageRoutes;
