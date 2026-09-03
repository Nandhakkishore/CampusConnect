import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/db';

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { imageBase64 } = req.body;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!imageBase64) {
      return sendError(res, 'Image data is required', 400);
    }

    const avatarUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: {
        userId,
        fullName: 'Student User',
        avatarUrl,
      },
    });

    return sendSuccess(res, { avatarUrl: updatedProfile.avatarUrl }, 'Avatar updated successfully');
  } catch (err) {
    next(err);
  }
};

export const savePushToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (!pushToken) {
      return sendError(res, 'Push token is required', 400);
    }

    await prisma.profile.upsert({
      where: { userId },
      update: { pushToken },
      create: {
        userId,
        fullName: 'Student User',
        pushToken,
      },
    });

    return sendSuccess(res, null, 'Push token saved successfully');
  } catch (err) {
    next(err);
  }
};
