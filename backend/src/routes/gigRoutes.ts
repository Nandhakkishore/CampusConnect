import { Router } from 'express';
import {
  getGigs,
  createGig,
  applyToGig,
  createGigSchema,
  applyGigSchema,
} from '../controllers/gigController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', getGigs);
router.post('/', authenticateToken, validateBody(createGigSchema), createGig);
router.post('/:id/apply', authenticateToken, validateBody(applyGigSchema), applyToGig);

export default router;
