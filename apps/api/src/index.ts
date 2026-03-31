import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middlewares/errorHandler';
import { config } from './config/env';

const app: Application = express();
const PORT = config.PORT || 4000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de 1000 requests por ventana
  message: {
    success: false,
    error: {
      message: 'Demasiadas peticiones, intenta de nuevo más tarde',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware global
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: config.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Configurar morgan para solo registrar rutas de API
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req: Request) => {
    // Solo registrar rutas que comienzan con /api
    return !req.path.startsWith('/api');
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'API Chat-Bot-LIA is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── Infrastructure / Observability Routes ────────────────────────────────────
// ARCHITECTURE DECISION: Business logic lives exclusively in Next.js API routes.
// This Express server handles only infrastructure concerns:
//   - Health checks (load balancer / container orchestration)
//   - Runtime metrics (uptime, memory usage)
//   - Build/version info
//
// See: apps/api/ARCHITECTURE.md
const API_VERSION = config.API_VERSION || 'v1';
const startTime = Date.now();

app.get(`/api/${API_VERSION}/version`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      apiVersion: API_VERSION,
      environment: config.NODE_ENV,
    },
  });
});

app.get(`/api/${API_VERSION}/metrics`, (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    data: {
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      node_version: process.version,
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling (debe ir al final)
app.use(errorHandler);

// 404 Handler - Manejar rutas no encontradas de forma silenciosa
app.use((req: Request, res: Response) => {
  // Solo responder con 404 JSON para rutas que comienzan con /api
  // Ignorar silenciosamente otras rutas que pueden ser de Next.js
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Ruta no encontrada',
        code: 'NOT_FOUND',
      },
    });
  } else {
    // Para rutas que no son de API, no hacer nada (dejar que Next.js las maneje)
    res.status(404).end();
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  // console.log(`🚀 Servidor Chat-Bot-LIA corriendo en http://localhost:${PORT}`);
  // console.log(`📚 API Version: ${API_VERSION}`);
  // console.log(`🌍 Environment: ${config.NODE_ENV}`);
  // console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

export default app;