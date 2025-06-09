"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
const Message = (0, mongoose_1.model)('Message', messageSchema);
exports.default = Message;
