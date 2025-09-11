/**
 * Redis-based rate limiter for production use
 */

import { createClient } from 'redis';
import logger from './logger.js';

class RedisRateLimiter {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackLimiter = new Map(); // Fallback for when Redis is unavailable
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.warn('Redis max retry attempts reached, using fallback rate limiter');
              return false; // Stop retrying
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.warn('Redis client error, using fallback rate limiter:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Failed to connect to Redis, using fallback rate limiter:', error.message);
      this.isConnected = false;
    }
  }

  async checkRateLimit(identifier, windowMs = 60000, maxRequests = 50) {
    if (!this.isConnected || !this.client) {
      return this.fallbackRateLimit(identifier, windowMs, maxRequests);
    }

    try {
      const key = `rate_limit:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis pipeline for atomic operations
      const pipeline = this.client.multi();
      
      // Remove expired entries
      pipeline.zRemRangeByScore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zCard(key);
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      const currentCount = results[1][1]; // Result of zCard

      if (currentCount >= maxRequests) {
        logger.warn(`Rate limit exceeded for ${identifier}: ${currentCount}/${maxRequests}`);
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + windowMs,
          retryAfter: Math.ceil(windowMs / 1000)
        };
      }

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowMs,
        retryAfter: 0
      };
    } catch (error) {
      logger.error('Redis rate limit check failed:', error);
      return this.fallbackRateLimit(identifier, windowMs, maxRequests);
    }
  }

  fallbackRateLimit(identifier, windowMs, maxRequests) {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    if (!this.fallbackLimiter.has(key)) {
      this.fallbackLimiter.set(key, { count: 0, resetTime: now + windowMs });
    }

    const data = this.fallbackLimiter.get(key);
    
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }

    if (data.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      };
    }

    data.count++;
    return {
      allowed: true,
      remaining: maxRequests - data.count,
      resetTime: data.resetTime,
      retryAfter: 0
    };
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default new RedisRateLimiter();
