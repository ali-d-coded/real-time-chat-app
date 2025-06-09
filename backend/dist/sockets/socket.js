"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const User_1 = __importDefault(require("../models/User"));
const setupSocket = (io) => {
    io.on('connection', async (socket) => {
        const userId = socket.user?.id;
        if (!userId)
            return;
        console.log(`🔌 ${userId} connected`);
        await User_1.default.findByIdAndUpdate(userId, { isOnline: true });
        socket.broadcast.emit('user_online', { id: userId });
        socket.on('disconnect', async () => {
            console.log(`❌ ${userId} disconnected`);
            await User_1.default.findByIdAndUpdate(userId, { isOnline: false });
            socket.broadcast.emit('user_offline', { id: userId });
        });
        // example: joining rooms by conversation ID
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
        });
        socket.on('send_message', async (data) => {
            const { conversationId, content } = data;
            const message = {
                sender: userId,
                conversationId,
                content,
                timestamp: new Date()
            };
            // Save to DB, emit to others
            io.to(conversationId).emit('receive_message', message);
        });
    });
};
exports.setupSocket = setupSocket;
