import { Router } from 'express';
import { uploadAvatar, savePushToken } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/avatar', authenticateToken, uploadAvatar);
router.post('/push-token', authenticateToken, savePushToken);

export default router;
