import { Router } from 'express';
import {
  getConversations,
  getMessages,
  getOrCreateDirectConversation,
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:id/messages', authenticateToken, getMessages);
router.post('/conversations/direct', authenticateToken, getOrCreateDirectConversation);

export default router;
