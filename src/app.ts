import  type { Application, Request, Response, NextFunction } from 'express';
import  express  from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import batchRoutes from './routes/batchRoutes';
import indexRoutes from './routes/indexRoutes';
import { Logger } from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  }),
);
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Routes
app.use('/api', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/batches', batchRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error("Unhandled error:", error);

  const statusCode = error.status || 500;
  const message =
    env.NODE_ENV === "production" ? "Internal server error" : error.message;

  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      Logger.info(`🚀 Server running on port ${env.PORT}`);
      Logger.info(`📁 Environment: ${env.NODE_ENV}`);
      Logger.info(`🌐 CORS Origin: ${env.CORS_ORIGIN}`);
    });
  } catch (error) {
    Logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  Logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

export default app;
