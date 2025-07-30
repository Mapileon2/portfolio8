import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { DatabaseService } from '../services/DatabaseService';
import { CacheService } from '../services/CacheService';
import { ProjectService } from '../services/ProjectService';
import { AnalyticsService } from '../services/AnalyticsService';
import { NotificationService } from '../services/NotificationService';
import { SearchService } from '../services/SearchService';

// Import route handlers
import projectRoutes from './routes/projects';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    max: number;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
}

export class APIServer {
  private app: express.Application;
  private config: AppConfig;
  private services: {
    db: DatabaseService;
    cache: CacheService;
    projects: ProjectService;
    analytics: AnalyticsService;
    notifications: NotificationService;
    search: SearchService;
  };

  constructor(config: AppConfig) {
    this.config = config;
    this.app = express();
    this.services = {} as any;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('API server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize API server:', error);
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    // Initialize database service
    this.services.db = new DatabaseService(this.config.database.url);
    await this.services.db.connect();

    // Initialize cache service
    this.services.cache = new CacheService(this.config.redis.url);
    await this.services.cache.connect();

    // Initialize other services
    this.services.projects = new ProjectService(this.services.db, this.services.cache);
    this.services.analytics = new AnalyticsService(this.services.cache, this.services.db);
    this.services.notifications = new NotificationService(this.services.cache, this.services.db);
    this.services.search = new SearchService(this.services.cache, this.services.db);

    // Setup service event listeners
    this.setupServiceEventListeners();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.github.com"]
        }
      }
    }));

    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging and analytics
    this.app.use(async (req, res, next) => {
      const startTime = Date.now();
      
      // Track API request
      await this.services.analytics.trackEvent('api_request', {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Add response time tracking
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
      });

      next();
    });

    // Add services to request object
    this.app.use((req, res, next) => {
      (req as any).services = this.services;
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: this.services.db.isConnected(),
          cache: this.services.cache.isConnected()
        }
      });
    });

    // API routes
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/notifications', notificationRoutes);

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Portfolio API',
        version: '1.0.0',
        endpoints: {
          projects: '/api/projects',
          analytics: '/api/analytics',
          search: '/api/search',
          notifications: '/api/notifications'
        },
        documentation: '/api/docs'
      });
    });

    // Catch-all for undefined routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('API Error:', error);

      // Track error
      this.services.analytics.trackEvent('api_error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send error response
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Optionally exit the process
      // process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Gracefully shutdown
      this.shutdown();
    });
  }

  private setupServiceEventListeners(): void {
    // Analytics events
    this.services.analytics.on('event_tracked', (event) => {
      console.log(`Analytics event tracked: ${event.type}`);
    });

    this.services.analytics.on('error', (error) => {
      console.error('Analytics service error:', error);
    });

    // Notification events
    this.services.notifications.on('notification_sent', (notification) => {
      console.log(`Notification sent: ${notification.id}`);
    });

    this.services.notifications.on('error', (error) => {
      console.error('Notification service error:', error);
    });

    // Search events
    this.services.search.on('document_indexed', (document) => {
      console.log(`Document indexed: ${document.id}`);
    });

    this.services.search.on('error', (error) => {
      console.error('Search service error:', error);
    });

    // Project events
    this.services.projects.on('project_created', async (project) => {
      console.log(`Project created: ${project.id}`);
      
      // Index the project for search
      await this.services.search.indexDocument({
        id: project.id,
        type: 'project',
        title: project.title,
        content: `${project.description} ${project.technologies.join(' ')}`,
        tags: project.technologies,
        category: project.category || 'project',
        metadata: {
          githubUrl: project.githubUrl,
          liveUrl: project.liveUrl,
          featured: project.featured
        }
      });
    });

    this.services.projects.on('project_updated', async (project) => {
      console.log(`Project updated: ${project.id}`);
      
      // Reindex the project
      await this.services.search.indexDocument({
        id: project.id,
        type: 'project',
        title: project.title,
        content: `${project.description} ${project.technologies.join(' ')}`,
        tags: project.technologies,
        category: project.category || 'project',
        metadata: {
          githubUrl: project.githubUrl,
          liveUrl: project.liveUrl,
          featured: project.featured
        }
      });
    });

    this.services.projects.on('project_deleted', async (projectId) => {
      console.log(`Project deleted: ${projectId}`);
      
      // Remove from search index
      await this.services.search.removeFromIndex(projectId);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.config.port, () => {
          console.log(`API server running on port ${this.config.port}`);
          resolve();
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
          console.log('SIGTERM received, shutting down gracefully');
          server.close(() => {
            this.shutdown();
          });
        });

        process.on('SIGINT', () => {
          console.log('SIGINT received, shutting down gracefully');
          server.close(() => {
            this.shutdown();
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async shutdown(): Promise<void> {
    try {
      console.log('Shutting down services...');
      
      // Stop services
      await this.services.analytics.stop();
      await this.services.notifications.stop();
      await this.services.search.stop();
      
      // Disconnect from databases
      await this.services.db.disconnect();
      await this.services.cache.disconnect();
      
      console.log('Services shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  getApp(): express.Application {
    return this.app;
  }

  getServices() {
    return this.services;
  }
}

// Export factory function
export function createAPIServer(config: AppConfig): APIServer {
  return new APIServer(config);
}

export default APIServer;