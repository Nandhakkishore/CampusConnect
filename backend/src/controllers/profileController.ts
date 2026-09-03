import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(300, 'Bio too long').optional(),
  branch: z.string().optional(),
  gradYear: z.number().optional(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid Portfolio URL').optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  lookingFor: z.array(z.string()).optional(),
});

export const getMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, id: true },
        },
      },
    });

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const getProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, id: true },
        },
      },
    });

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { fullName, bio, branch, gradYear, githubUrl, portfolioUrl, skills, lookingFor } = req.body;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: userId! },
      update: {
        ...(fullName && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(branch && { branch }),
        ...(gradYear && { gradYear }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(portfolioUrl !== undefined && { portfolioUrl }),
        ...(skills && { skills }),
        ...(lookingFor && { lookingFor }),
      },
      create: {
        userId: userId!,
        fullName: fullName || 'Campus Student',
        bio: bio || '',
        branch: branch || 'Computer Science',
        gradYear: gradYear || 2026,
        githubUrl: githubUrl || '',
        portfolioUrl: portfolioUrl || '',
        skills: skills || ['JavaScript', 'React'],
        lookingFor: lookingFor || ['Hackathon Partner'],
      },
    });

    return sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};
