import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.patch('/:id/read', authenticateToken, markAsRead);
router.post('/read-all', authenticateToken, markAllAsRead);

export default router;
