import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', googleLogin);
router.post('/refresh', validateBody(refreshSchema), refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

export default router;
