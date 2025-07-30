import { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export interface DatabaseConfig {
  url?: string;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  logLevel?: 'info' | 'query' | 'warn' | 'error';
  enableMetrics?: boolean;
}

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  errorCount: number;
  connectionCount: number;
}

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export class DatabaseService {
  private prisma: PrismaClient;
  private metrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    errorCount: 0,
    connectionCount: 0
  };
  private queryTimes: number[] = [];
  private slowQueryThreshold = 1000; // 1 second

  constructor(config: DatabaseConfig = {}) {
    const {
      url = process.env.DATABASE_URL,
      maxConnections = 10,
      connectionTimeout = 10000,
      queryTimeout = 30000,
      logLevel = 'warn',
      enableMetrics = true
    } = config;

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url
        }
      },
      log: [
        { level: 'query', emit: enableMetrics ? 'event' : 'stdout' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ]
    });

    if (enableMetrics) {
      this.setupMetrics();
    }

    // Handle graceful shutdown
    process.on('beforeExit', () => {
      this.disconnect();
    });
  }

  /**
   * Get Prisma client instance
   */
  get client(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get all collections/models
   */
  get project() {
    return this.prisma.project;
  }

  get user() {
    return this.prisma.user;
  }

  get skill() {
    return this.prisma.skill;
  }

  get testimonial() {
    return this.prisma.testimonial;
  }

  get timeline() {
    return this.prisma.timeline;
  }

  get technology() {
    return this.prisma.technology;
  }

  get media() {
    return this.prisma.media;
  }

  get caseStudy() {
    return this.prisma.caseStudy;
  }

  get contactForm() {
    return this.prisma.contactForm;
  }

  get analytics() {
    return this.prisma.analytics;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$transaction(fn, {
        maxWait: options.maxWait || 5000,
        timeout: options.timeout || 10000,
        isolationLevel: options.isolationLevel
      });
      
      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Transaction error:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw(sql: string, values?: any[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$executeRaw(
        Prisma.sql([sql], ...(values || []))
      );
      
      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Raw query error:', error);
      throw error;
    }
  }

  /**
   * Query raw SQL
   */
  async queryRaw<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$queryRaw<T[]>(
        Prisma.sql([sql], ...(values || []))
      );
      
      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Raw query error:', error);
      throw error;
    }
  }

  /**
   * Bulk insert with conflict resolution
   */
  async bulkUpsert<T>(
    model: string,
    data: any[],
    conflictFields: string[],
    updateFields?: string[]
  ): Promise<{ created: number; updated: number }> {
    if (data.length === 0) {
      return { created: 0, updated: 0 };
    }

    const startTime = Date.now();
    let created = 0;
    let updated = 0;

    try {
      await this.transaction(async (tx) => {
        for (const item of data) {
          const whereClause = conflictFields.reduce((acc, field) => {
            acc[field] = item[field];
            return acc;
          }, {} as any);

          const existing = await (tx as any)[model].findFirst({
            where: whereClause
          });

          if (existing) {
            if (updateFields) {
              const updateData = updateFields.reduce((acc, field) => {
                if (item[field] !== undefined) {
                  acc[field] = item[field];
                }
                return acc;
              }, {} as any);

              if (Object.keys(updateData).length > 0) {
                await (tx as any)[model].update({
                  where: { id: existing.id },
                  data: updateData
                });
                updated++;
              }
            }
          } else {
            await (tx as any)[model].create({
              data: item
            });
            created++;
          }
        }
      });

      this.recordQueryTime(Date.now() - startTime);
      return { created, updated };
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Bulk upsert error:', error);
      throw error;
    }
  }

  /**
   * Paginated query with cursor-based pagination
   */
  async paginatedQuery<T>(
    model: string,
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
      cursor?: any;
      take?: number;
      skip?: number;
    } = {}
  ): Promise<{
    data: T[];
    hasMore: boolean;
    nextCursor?: any;
    total?: number;
  }> {
    const startTime = Date.now();
    const { take = 10, skip = 0, cursor, ...queryOptions } = options;

    try {
      const [data, total] = await Promise.all([
        (this.prisma as any)[model].findMany({
          ...queryOptions,
          ...(cursor && { cursor }),
          take: take + 1, // Take one extra to check if there are more
          skip
        }),
        (this.prisma as any)[model].count({
          where: queryOptions.where
        })
      ]);

      const hasMore = data.length > take;
      const results = hasMore ? data.slice(0, -1) : data;
      const nextCursor = hasMore ? data[data.length - 2] : null;

      this.recordQueryTime(Date.now() - startTime);

      return {
        data: results,
        hasMore,
        nextCursor,
        total
      };
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Paginated query error:', error);
      throw error;
    }
  }

  /**
   * Full-text search
   */
  async fullTextSearch<T>(
    model: string,
    searchTerm: string,
    searchFields: string[],
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      take?: number;
      skip?: number;
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Build search conditions
      const searchConditions = searchFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const
        }
      }));

      const whereClause = {
        AND: [
          options.where || {},
          {
            OR: searchConditions
          }
        ]
      };

      const result = await (this.prisma as any)[model].findMany({
        where: whereClause,
        orderBy: options.orderBy,
        include: options.include,
        take: options.take,
        skip: options.skip
      });

      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Full-text search error:', error);
      throw error;
    }
  }

  /**
   * Aggregate query
   */
  async aggregate(
    model: string,
    options: {
      where?: any;
      groupBy?: any;
      having?: any;
      orderBy?: any;
      _count?: any;
      _sum?: any;
      _avg?: any;
      _min?: any;
      _max?: any;
    }
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await (this.prisma as any)[model].aggregate(options);
      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Aggregate query error:', error);
      throw error;
    }
  }

  /**
   * Group by query
   */
  async groupBy(
    model: string,
    options: {
      by: string[];
      where?: any;
      having?: any;
      orderBy?: any;
      _count?: any;
      _sum?: any;
      _avg?: any;
      _min?: any;
      _max?: any;
    }
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await (this.prisma as any)[model].groupBy(options);
      this.recordQueryTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      console.error('Group by query error:', error);
      throw error;
    }
  }

  /**
   * Database health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
    connectionCount?: number;
  }> {
    try {
      const start = Date.now();
      
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connectionCount: this.metrics.connectionCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get database metrics
   */
  getMetrics(): QueryMetrics {
    return {
      ...this.metrics,
      averageQueryTime: this.queryTimes.length > 0 
        ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
        : 0
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      errorCount: 0,
      connectionCount: 0
    };
    this.queryTimes = [];
  }

  /**
   * Backup database (PostgreSQL specific)
   */
  async backup(outputPath: string): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      
      return new Promise((resolve, reject) => {
        const pgDump = spawn('pg_dump', [
          process.env.DATABASE_URL!,
          '--file', outputPath,
          '--verbose',
          '--no-owner',
          '--no-privileges'
        ]);

        pgDump.on('close', (code) => {
          if (code === 0) {
            console.log(`Database backup completed: ${outputPath}`);
            resolve(true);
          } else {
            reject(new Error(`pg_dump exited with code ${code}`));
          }
        });

        pgDump.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Database backup error:', error);
      return false;
    }
  }

  /**
   * Migrate database
   */
  async migrate(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
          stdio: 'inherit'
        });

        migrate.on('close', (code) => {
          if (code === 0) {
            console.log('Database migration completed');
            resolve(true);
          } else {
            reject(new Error(`Migration failed with code ${code}`));
          }
        });

        migrate.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Database migration error:', error);
      return false;
    }
  }

  /**
   * Seed database
   */
  async seed(seedData: Record<string, any[]>): Promise<boolean> {
    try {
      await this.transaction(async (tx) => {
        for (const [model, data] of Object.entries(seedData)) {
          console.log(`Seeding ${model} with ${data.length} records`);
          
          for (const item of data) {
            await (tx as any)[model].upsert({
              where: { id: item.id },
              update: item,
              create: item
            });
          }
        }
      });

      console.log('Database seeding completed');
      return true;
    } catch (error) {
      console.error('Database seeding error:', error);
      return false;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('Database disconnected');
    } catch (error) {
      console.error('Database disconnect error:', error);
    }
  }

  // Private methods

  private setupMetrics(): void {
    this.prisma.$on('query', (e) => {
      this.metrics.totalQueries++;
      const queryTime = e.duration;
      
      this.recordQueryTime(queryTime);
      
      if (queryTime > this.slowQueryThreshold) {
        this.metrics.slowQueries++;
        console.warn(`Slow query detected (${queryTime}ms):`, e.query);
      }
    });

    // Track connection events if available
    this.prisma.$on('info' as any, (e: any) => {
      if (e.message.includes('connection')) {
        this.metrics.connectionCount++;
      }
    });
  }

  private recordQueryTime(time: number): void {
    this.queryTimes.push(time);
    
    // Keep only last 1000 query times for memory efficiency
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export const getDatabaseService = (config?: DatabaseConfig): DatabaseService => {
  if (!dbInstance) {
    dbInstance = new DatabaseService(config);
  }
  return dbInstance;
};

export default DatabaseService;