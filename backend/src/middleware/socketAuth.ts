import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const socketAuth = (socket: Socket, next: any) => {
  const token = socket.handshake.auth.token;

  if (!token) return next(new Error('Authentication error'));

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (socket as any).user = payload; // attach user info
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};
