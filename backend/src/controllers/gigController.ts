import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';

export const createGigSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  category: z.string().min(2, 'Category required'),
  stipend: z.string().optional(),
  estimatedTime: z.string().optional(),
  skillsRequired: z.array(z.string()).default([]),
});

export const applyGigSchema = z.object({
  pitchNote: z.string().min(5, 'Please provide a short pitch note'),
  portfolioLink: z.string().optional(),
});

export const getGigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, status = 'OPEN' } = req.query;
    const userId = (req as AuthenticatedRequest).user?.userId;

    const where: any = { status: status as any };

    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const gigs = await prisma.gig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        _count: {
          select: { applications: true },
        },
        ...(userId
          ? {
              applications: {
                where: { applicantId: userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const formatted = gigs.map((g) => {
      const { applications, ...rest } = g as any;
      return {
        ...rest,
        hasApplied: Array.isArray(applications) && applications.length > 0,
      };
    });

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
};

export const createGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const gig = await prisma.gig.create({
      data: {
        creatorId: userId!,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        stipend: req.body.stipend || 'Unpaid / Experience',
        estimatedTime: req.body.estimatedTime || '1-2 weeks',
        skillsRequired: req.body.skillsRequired || [],
        status: 'OPEN',
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return sendSuccess(res, gig, 'Gig posted successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const applyToGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: gigId } = req.params;
    const userId = req.user?.userId;
    const { pitchNote, portfolioLink } = req.body;

    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return sendError(res, 'Gig not found', 404);
    }

    if (gig.creatorId === userId) {
      return sendError(res, 'You cannot apply to your own gig', 400);
    }

    const existingApp = await prisma.gigApplication.findUnique({
      where: {
        gigId_applicantId: {
          gigId,
          applicantId: userId!,
        },
      },
    });

    if (existingApp) {
      return sendError(res, 'You have already applied for this gig', 400);
    }

    const application = await prisma.gigApplication.create({
      data: {
        gigId,
        applicantId: userId!,
        pitchNote,
        portfolioLink: portfolioLink || '',
        status: 'PENDING',
      },
      include: {
        applicant: { include: { profile: true } },
      },
    });

    // Notify gig creator
    const applicantName = application.applicant.profile?.fullName || 'A student';
    const notif = await prisma.notification.create({
      data: {
        userId: gig.creatorId,
        title: 'New Gig Applicant',
        message: `${applicantName} applied for gig "${gig.title}"`,
        type: 'APPLICATION_STATUS',
        payload: { gigId, applicationId: application.id },
      },
    });

    io.to(`user:${gig.creatorId}`).emit('notification:new', notif);

    return sendSuccess(res, application, 'Gig application submitted', 201);
  } catch (err) {
    next(err);
  }
};
