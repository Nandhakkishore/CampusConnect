import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleUpvote,
  addComment,
  getComments,
  createProjectSchema,
  updateProjectSchema,
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authenticateToken, validateBody(createProjectSchema), createProject);
router.put('/:id', authenticateToken, validateBody(updateProjectSchema), updateProject);
router.delete('/:id', authenticateToken, deleteProject);

router.post('/:id/upvote', authenticateToken, toggleUpvote);
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);

export default router;
