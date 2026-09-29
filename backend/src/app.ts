import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import projectRoutes from './routes/projectRoutes';
import teamRoutes from './routes/teamRoutes';
import chatRoutes from './routes/chatRoutes';
import gigRoutes from './routes/gigRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'CampusConnect Backend API',
    status: 'online',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoints
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    name: 'CampusConnect Backend API',
    database: 'Neon PostgreSQL',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes (supports both /api/* and direct routes)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/profiles', '/profiles'], profileRoutes);
app.use(['/api/projects', '/projects'], projectRoutes);
app.use(['/api', '/'], teamRoutes);
app.use(['/api/chat', '/chat'], chatRoutes);
app.use(['/api/gigs', '/gigs'], gigRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/upload', '/upload'], uploadRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
