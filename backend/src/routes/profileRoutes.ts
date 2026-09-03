import { Router } from 'express';
import { getMyProfile, getProfileByUserId, updateProfile, updateProfileSchema } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, validateBody(updateProfileSchema), updateProfile);
router.get('/user/:userId', getProfileByUserId);

export default router;
