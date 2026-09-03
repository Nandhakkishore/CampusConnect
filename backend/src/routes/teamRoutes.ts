import { Router } from 'express';
import {
  applyToProject,
  getProjectApplications,
  updateApplicationStatus,
  applyToProjectSchema,
  updateApplicationStatusSchema,
} from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.post('/projects/:id/apply', authenticateToken, validateBody(applyToProjectSchema), applyToProject);
router.get('/projects/:id/applications', authenticateToken, getProjectApplications);
router.patch('/applications/:applicationId/status', authenticateToken, validateBody(updateApplicationStatusSchema), updateApplicationStatus);

export default router;
