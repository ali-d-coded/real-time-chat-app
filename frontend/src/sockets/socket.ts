import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  console.log('Connecting socket with token:', !!token);
  
  // Make sure this matches your server port!
  const uri = import.meta.env.VITE_BACKEND_URL as string || "http://localhost:9099"; // Changed from 9099 to 5000
  console.log('Connecting to URI:', uri);
  
  // Disconnect existing socket if any
  if (socket) {
    console.log('Disconnecting existing socket');
    socket.disconnect();
    socket = null;
  }
  
  socket = io(uri, {
    auth: { token },
    // Add additional configuration for better debugging
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10000,
    forceNew: true,
    // Alternative token methods in case auth doesn't work
    query: { token },
    extraHeaders: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Enhanced event listeners for debugging
  socket.on('connect', () => {
    console.log('Socket connected successfully!');
    console.log('Socket ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log(' Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error(' Socket connection error:', error);
    console.error(' Error message:', error.message);
  });

  socket.on('error', (error) => {
    console.error(' Socket error event:', error);
  });

  // Add reconnection event listeners
  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Socket reconnection attempt:', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed - giving up');
  });

  return socket;
};

export const getSocket = () => socket;

// Helper function to check if socket is connected
export const isSocketConnected = () => {
  return socket?.connected || false;
};

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    console.log('Manually disconnecting socket');
    socket.disconnect();
    socket = null;
  }
};

// Helper function to emit events with error handling
export const emitWithCallback = (event: string, data: any, timeout = 5000): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`Event ${event} timed out`));
    }, timeout);

    socket.emit(event, data, (response: any) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
};