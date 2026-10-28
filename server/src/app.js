import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import borrowingRoutes from './routes/borrowingRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { seedDatabase } from './utils/seedData.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration supporting local dev, custom domains, and Vercel deployments
const allowedOrigins = [
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Ensure MongoDB is connected for every request (essential for serverless environments)
app.use(async (req, res, next) => {
  // Allow health check to respond even if DB is still connecting
  if (req.path === '/api/health' || req.path === '/api') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed on request:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is configured.',
      error: env.nodeEnv === 'production' ? undefined : err.message,
    });
  }
});

// Root & Health check routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Library Book Borrowing Management API',
    environment: env.nodeEnv,
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Seed endpoint - allows initializing books and demo accounts on deployment
app.all('/api/seed', async (req, res, next) => {
  try {
    await connectDB();
    const result = await seedDatabase();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Application routes
app.use('/api/auth', authRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
