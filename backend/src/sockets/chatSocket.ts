import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/db';

export const setupSocketHandlers = (io: Server) => {
  // Socket JWT authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Socket authentication error: Token missing'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch (err) {
      return next(new Error('Socket authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user) return;

    const userId = user.userId;
    console.log(`⚡ User connected to socket: ${userId} (Socket ID: ${socket.id})`);

    // Join user room for private notifications and updates
    socket.join(`user:${userId}`);

    // Join specific conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined room conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send real-time chat message
    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      const { conversationId, content } = data;
      if (!content || !content.trim()) return;

      try {
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: content.trim(),
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        });

        // Update conversation timestamp
        await prisma.chatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to room
        io.to(`conversation:${conversationId}`).emit('chat:message', message);

        // Fetch participants to create notifications for offline users
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          include: { user: { include: { profile: true } } },
        });

        const senderName = message.sender?.profile?.fullName || 'Campus Member';

        for (const p of participants) {
          if (p.userId !== userId) {
            const notif = await prisma.notification.create({
              data: {
                userId: p.userId,
                title: `Message from ${senderName}`,
                message: content.length > 40 ? `${content.substring(0, 40)}...` : content,
                type: 'MESSAGE',
                payload: { conversationId, senderId: userId },
              },
            });

            io.to(`user:${p.userId}`).emit('notification:new', notif);
          }
        }
      } catch (err) {
        console.error('Error handling send_message socket event:', err);
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${userId}`);
    });
  });
};
