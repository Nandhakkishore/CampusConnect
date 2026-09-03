import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './sockets/chatSocket';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.io initialization
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 CampusConnect server running on port ${PORT}`);
  });
}

export { server };
