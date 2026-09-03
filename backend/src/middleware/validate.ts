import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues[0]?.message || 'Validation error';
        return sendError(res, issue, 400, error.issues);
      }
      return sendError(res, 'Invalid request data', 400);
    }
  };
};
