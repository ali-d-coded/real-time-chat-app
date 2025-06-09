import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { setupSocket } from './sockets/socket';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Enhanced CORS configuration
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST"]
  },
  // Add connection timeout and other options
  connectTimeout: 60000,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Remove duplicate middleware - you have it in both places
// io.use(socketAuth); // Remove this line since setupSocket has its own auth

setupSocket(io);

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      console.log(`📡 Socket.IO server ready`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));