import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';

export const applyToProjectSchema = z.object({
  note: z.string().min(5, 'Please provide a short pitch (at least 5 chars)'),
  contactLink: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const applyToProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.userId;
    const { note, contactLink } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    if (project.ownerId === userId) {
      return sendError(res, 'You cannot apply to your own project', 400);
    }

    const existingApp = await prisma.application.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userId!,
        },
      },
    });

    if (existingApp) {
      return sendError(res, 'You have already applied to this project', 400);
    }

    const application = await prisma.application.create({
      data: {
        projectId,
        userId: userId!,
        note,
        contactLink: contactLink || '',
        status: 'PENDING',
      },
      include: {
        applicant: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    // Notify project owner
    const applicantName = application.applicant.profile?.fullName || 'A student';
    const notification = await prisma.notification.create({
      data: {
        userId: project.ownerId,
        title: 'New Team Application',
        message: `${applicantName} applied to join "${project.title}"`,
        type: 'APPLICATION_STATUS',
        payload: { projectId, applicationId: application.id },
      },
    });

    io.to(`user:${project.ownerId}`).emit('notification:new', notification);

    return sendSuccess(res, application, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getProjectApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.userId;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    if (project.ownerId !== userId) {
      return sendError(res, 'Unauthorized to view applications', 403);
    }

    const applications = await prisma.application.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return sendSuccess(res, applications);
  } catch (err) {
    next(err);
  }
};

export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.userId;
    const { status } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        applicant: { include: { profile: true } },
      },
    });

    if (!application) {
      return sendError(res, 'Application not found', 404);
    }

    if (application.project.ownerId !== userId) {
      return sendError(res, 'Unauthorized', 403);
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    if (status === 'ACCEPTED') {
      // Find or create Team
      let team = await prisma.team.findUnique({
        where: { projectId: application.projectId },
        include: { conversation: true },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            projectId: application.projectId,
            name: `${application.project.title} Team`,
          },
          include: { conversation: true },
        });

        // Add owner as OWNER
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: application.project.ownerId,
            role: 'OWNER',
          },
        });
      }

      // Add applicant as MEMBER if not present
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: application.userId,
          },
        },
      });

      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: application.userId,
            role: 'MEMBER',
          },
        });
      }

      // Find or create TEAM Chat Conversation
      let conversation = team.conversation;
      if (!conversation) {
        conversation = await prisma.chatConversation.create({
          data: {
            type: 'TEAM',
            teamId: team.id,
            name: `${application.project.title} Chat`,
          },
        });
      }

      // Add both owner & applicant to ConversationParticipant
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: application.project.ownerId,
          },
        },
        update: {},
        create: {
          conversationId: conversation.id,
          userId: application.project.ownerId,
        },
      });

      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: application.userId,
          },
        },
        update: {},
        create: {
          conversationId: conversation.id,
          userId: application.userId,
        },
      });

      // Post system join message
      const applicantName = application.applicant.profile?.fullName || 'A student';
      const systemMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: `🎉 ${applicantName} joined the team!`,
          isSystem: true,
        },
      });

      // Broadcast system message over socket
      io.to(`conversation:${conversation.id}`).emit('chat:message', systemMessage);

      // Send notification to applicant
      const notif = await prisma.notification.create({
        data: {
          userId: application.userId,
          title: 'Application Accepted!',
          message: `You have been accepted into "${application.project.title}". Tap to view group chat!`,
          type: 'APPLICATION_STATUS',
          payload: { conversationId: conversation.id, projectId: application.projectId },
        },
      });

      io.to(`user:${application.userId}`).emit('notification:new', notif);
    } else {
      // Send rejection notification
      const notif = await prisma.notification.create({
        data: {
          userId: application.userId,
          title: 'Application Update',
          message: `Your application for "${application.project.title}" was not selected.`,
          type: 'APPLICATION_STATUS',
          payload: { projectId: application.projectId },
        },
      });

      io.to(`user:${application.userId}`).emit('notification:new', notif);
    }

    return sendSuccess(res, updated, `Application ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};
