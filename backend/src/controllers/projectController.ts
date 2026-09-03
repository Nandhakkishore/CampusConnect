import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  branch: z.string().optional(),
  techStack: z.array(z.string()).min(1, 'Select at least one tech stack tag'),
  status: z.enum(['IDEA', 'IN_PROGRESS', 'RECRUITING', 'COMPLETED']).optional(),
  repositoryUrl: z.string().url('Invalid repo URL').optional().or(z.literal('')),
  demoUrl: z.string().url('Invalid demo URL').optional().or(z.literal('')),
});

export const updateProjectSchema = createProjectSchema.partial();

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, branch, techStack, status, page = '1', limit = '10' } = req.query;
    const userId = (req as AuthenticatedRequest).user?.userId;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (branch && branch !== 'ALL') {
      where.branch = branch as string;
    }

    if (status) {
      where.status = status as any;
    }

    if (techStack) {
      const stacks = Array.isArray(techStack) ? techStack : (techStack as string).split(',');
      where.techStack = {
        hasSome: stacks as string[],
      };
    }

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
              comments: true,
              applications: true,
            },
          },
          ...(userId
            ? {
                upvotes: {
                  where: { userId },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
    ]);

    const formattedProjects = projects.map((p) => {
      const { upvotes, ...rest } = p as any;
      return {
        ...rest,
        hasUpvoted: Array.isArray(upvotes) && upvotes.length > 0,
      };
    });

    return sendSuccess(res, {
      projects: formattedProjects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user?.userId;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        _count: {
          select: {
            upvotes: true,
            comments: true,
            applications: true,
          },
        },
        ...(userId
          ? {
              upvotes: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const { upvotes, ...rest } = project as any;
    return sendSuccess(res, {
      ...rest,
      hasUpvoted: Array.isArray(upvotes) && upvotes.length > 0,
    });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const project = await prisma.project.create({
      data: {
        ownerId: userId!,
        title: req.body.title,
        summary: req.body.summary,
        description: req.body.description,
        branch: req.body.branch || 'Computer Science',
        techStack: req.body.techStack || [],
        status: req.body.status || 'RECRUITING',
        repositoryUrl: req.body.repositoryUrl || '',
        demoUrl: req.body.demoUrl || '',
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        _count: {
          select: {
            upvotes: true,
            comments: true,
            applications: true,
          },
        },
      },
    });

    return sendSuccess(res, { ...project, hasUpvoted: false }, 'Project created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Project not found', 404);
    }

    if (existing.ownerId !== userId) {
      return sendError(res, 'Unauthorized to edit this project', 403);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: req.body,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return sendSuccess(res, updated, 'Project updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Project not found', 404);
    }

    if (existing.ownerId !== userId) {
      return sendError(res, 'Unauthorized to delete this project', 403);
    }

    await prisma.project.delete({ where: { id } });
    return sendSuccess(res, null, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const toggleUpvote = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const existingUpvote = await prisma.projectUpvote.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId!,
        },
      },
    });

    if (existingUpvote) {
      await prisma.projectUpvote.delete({
        where: { id: existingUpvote.id },
      });
      return sendSuccess(res, { hasUpvoted: false }, 'Upvote removed');
    } else {
      await prisma.projectUpvote.create({
        data: {
          projectId: id,
          userId: userId!,
        },
      });
      return sendSuccess(res, { hasUpvoted: true }, 'Project upvoted');
    }
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return sendError(res, 'Comment content cannot be empty', 400);
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId: id,
        userId: userId!,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    return sendSuccess(res, comment, 'Comment added', 201);
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    return sendSuccess(res, comments);
  } catch (err) {
    next(err);
  }
};
