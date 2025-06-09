"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationIfNotExists = exports.getMessages = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const PAGE_SIZE = 20;
const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const messages = await Message_1.default.find({ conversationId })
        .sort({ timestamp: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate('sender', '_id username');
    res.json(messages.reverse()); // return newest last
    return;
};
exports.getMessages = getMessages;
const createConversationIfNotExists = async (req, res) => {
    const { userId: receiverId } = req.body;
    const senderId = req.user.id;
    let convo = await Conversation_1.default.findOne({
        participants: { $all: [senderId, receiverId], $size: 2 },
    });
    if (!convo) {
        convo = new Conversation_1.default({ participants: [senderId, receiverId] });
        await convo.save();
    }
    res.json(convo);
    return;
};
exports.createConversationIfNotExists = createConversationIfNotExists;
