import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = participants.map((p: any) => p.conversationId);

    const conversations = await prisma.chatConversation.findMany({
      where: {
        id: { in: conversationIds },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                profile: true,
              },
            },
          },
        },
        team: {
          include: { project: true },
        },
      },
    });

    const formatted = conversations.map((conv: any) => {
      const { messages, ...rest } = conv;
      return {
        ...rest,
        lastMessage: messages[0] || null,
      };
    });

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user?.userId;

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: userId!,
        },
      },
    });

    if (!isParticipant) {
      return sendError(res, 'Unauthorized to view this conversation', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
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

    // Update lastReadAt for this participant
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: userId!,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return sendSuccess(res, messages);
  } catch (err) {
    next(err);
  }
};

export const getOrCreateDirectConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return sendError(res, 'Target user ID is required', 400);
    }

    if (userId === targetUserId) {
      return sendError(res, 'Cannot start a chat with yourself', 400);
    }

    // Check if direct conversation already exists between both users
    const existingConvs = await prisma.chatConversation.findMany({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
      },
    });

    if (existingConvs.length > 0) {
      return sendSuccess(res, existingConvs[0]);
    }

    // Create new direct conversation
    const newConv = await prisma.chatConversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: userId! },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, profile: true } },
          },
        },
      },
    });

    return sendSuccess(res, newConv, 'Direct chat initialized', 201);
  } catch (err) {
    next(err);
  }
};
