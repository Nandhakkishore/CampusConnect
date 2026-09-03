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

// Base health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', teamRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
