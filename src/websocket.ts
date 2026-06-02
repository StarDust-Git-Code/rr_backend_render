import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { getLiveSnapshot } from './liveData.js';

export function setupWebSockets(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: "*", // Allow all origins for local/VPS usage
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Allow frontend to request the latest state immediately
    socket.on('request:status', (roverId: string) => {
      const state = getLiveSnapshot(roverId);
      if (state) {
        socket.emit(`rover:${roverId}:status`, state);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
