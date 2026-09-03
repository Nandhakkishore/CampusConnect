import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
