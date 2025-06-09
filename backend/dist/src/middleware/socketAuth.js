"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const socketAuth = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token)
        return next(new Error('Authentication error'));
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        socket.user = payload; // attach user info
        next();
    }
    catch (err) {
        next(new Error('Invalid token'));
    }
};
exports.socketAuth = socketAuth;
