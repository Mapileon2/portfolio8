import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export class CacheService {
  private redis: Redis;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  private defaultTTL: number = 3600; // 1 hour
  private keyPrefix: string = 'portfolio:';

  constructor(redisUrl?: string, options: { defaultTTL?: number; keyPrefix?: string } = {}) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: options.keyPrefix || this.keyPrefix
    });

    this.defaultTTL = options.defaultTTL || this.defaultTTL;
    this.keyPrefix = options.keyPrefix || this.keyPrefix;

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.stats.errors++;
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const cached = await this.redis.get(cacheKey);
      
      if (cached === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      
      if (options.serialize !== false) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          console.warn('Failed to parse cached value:', parseError);
          return cached as unknown as T;
        }
      }
      
      return cached as unknown as T;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const cacheTTL = ttl || options.ttl || this.defaultTTL;
      
      let serializedValue: string;
      
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = String(value);
      }

      if (options.compress && serializedValue.length > 1024) {
        // Implement compression for large values
        serializedValue = await this.compress(serializedValue);
      }

      const result = await this.redis.setex(cacheKey, cacheTTL, serializedValue);
      
      if (result === 'OK') {
        this.stats.sets++;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cache set error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.redis.del(cacheKey);
      
      if (result > 0) {
        this.stats.deletes++;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cache delete error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache keys by pattern
   */
  async invalidate(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      const searchPattern = this.buildKey(pattern, options.prefix);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      // Remove prefix from keys since Redis client adds it automatically
      const cleanKeys = keys.map(key => key.replace(this.keyPrefix, ''));
      const result = await this.redis.del(...cleanKeys);
      
      this.stats.deletes += result;
      return result;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key, options.prefix));
      const values = await this.redis.mget(...cacheKeys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        
        if (options.serialize !== false) {
          try {
            return JSON.parse(value);
          } catch (parseError) {
            console.warn(`Failed to parse cached value for key ${keys[index]}:`, parseError);
            return value as unknown as T;
          }
        }
        
        return value as unknown as T;
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      this.stats.errors++;
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values at once
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const cacheTTL = ttl || options.ttl || this.defaultTTL;
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const cacheKey = this.buildKey(key, options.prefix);
        let serializedValue: string;
        
        if (options.serialize !== false) {
          serializedValue = JSON.stringify(value);
        } else {
          serializedValue = String(value);
        }
        
        pipeline.setex(cacheKey, cacheTTL, serializedValue);
      }
      
      const results = await pipeline.exec();
      const successCount = results?.filter(([error, result]) => !error && result === 'OK').length || 0;
      
      this.stats.sets += successCount;
      return successCount === Object.keys(keyValuePairs).length;
    } catch (error) {
      console.error('Cache mset error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, amount: number = 1, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.redis.incrby(cacheKey, amount);
      
      // Set TTL if this is a new key
      if (result === amount) {
        const cacheTTL = options.ttl || this.defaultTTL;
        await this.redis.expire(cacheKey, cacheTTL);
      }
      
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options.prefix);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      this.stats.errors++;
      return -1;
    }
  }

  /**
   * Add item to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const cacheKey = this.buildKey(key);
      return await this.redis.sadd(cacheKey, ...members);
    } catch (error) {
      console.error('Cache sadd error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      const cacheKey = this.buildKey(key);
      return await this.redis.smembers(cacheKey);
    } catch (error) {
      console.error('Cache smembers error:', error);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Remove item from a set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const cacheKey = this.buildKey(key);
      return await this.redis.srem(cacheKey, ...members);
    } catch (error) {
      console.error('Cache srem error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Flush all cache data
   */
  async flush(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private buildKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || '';
    return finalPrefix ? `${finalPrefix}:${key}` : key;
  }

  private generateCacheKey(data: any): string {
    return createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  private async compress(data: string): Promise<string> {
    // Simple compression implementation
    // In production, you might want to use a proper compression library
    try {
      const { gzip } = await import('zlib');
      const { promisify } = await import('util');
      const gzipAsync = promisify(gzip);
      
      const compressed = await gzipAsync(Buffer.from(data));
      return `gzip:${compressed.toString('base64')}`;
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return data;
    }
  }

  private async decompress(data: string): Promise<string> {
    if (!data.startsWith('gzip:')) {
      return data;
    }

    try {
      const { gunzip } = await import('zlib');
      const { promisify } = await import('util');
      const gunzipAsync = promisify(gunzip);
      
      const compressed = Buffer.from(data.slice(5), 'base64');
      const decompressed = await gunzipAsync(compressed);
      return decompressed.toString();
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export const getCacheService = (redisUrl?: string): CacheService => {
  if (!cacheInstance) {
    cacheInstance = new CacheService(redisUrl);
  }
  return cacheInstance;
};

export default CacheService;