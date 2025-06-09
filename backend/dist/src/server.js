"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("./sockets/socket");
const socketAuth_1 = require("./middleware/socketAuth");
dotenv_1.default.config();
console.log("PORT :", process.env.PORT);
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
});
io.use(socketAuth_1.socketAuth);
(0, socket_1.setupSocket)(io);
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
})
    .catch(err => console.error('MongoDB connection error:', err));
