import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, AppError } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';

// Configure CORS
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test error endpoint
app.get('/error-test', (req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error('Test error');
  error.statusCode = 400;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
}); 