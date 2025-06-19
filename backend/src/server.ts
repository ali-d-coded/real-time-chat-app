import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { setupSocket } from './sockets/socket';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST"]
  },
  connectTimeout: 60000,
  pingTimeout: 60000,
  pingInterval: 25000
});

setupSocket(io);

mongoose.connect(process.env.MONGO_URI!, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log(`📡 Socket.IO server ready`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n⏹️ Gracefully shutting down...');
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});
