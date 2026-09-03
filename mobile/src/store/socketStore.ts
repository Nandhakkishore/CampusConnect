import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Socket.io server');
      set({ isConnected: true });
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ Disconnected from Socket.io server');
      set({ isConnected: false });
    });

    set({ socket: socketInstance });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
