/**
 * Cache Service (Redis-Ready Mock)
 * --------------------------------
 * In-memory cache with TTL support. Designed as a drop-in replacement
 * for Redis — swap the implementation when Redis is available.
 *
 * SCALABILITY NOTE:
 * This mock uses a JS Map, which works for single-instance deployments.
 * For multi-instance (clustered) deployments, replace with Redis:
 *   const redis = require("ioredis");
 *   const client = new redis(process.env.REDIS_URL);
 *
 * The interface (get, set, del, invalidatePattern) stays the same,
 * making the swap seamless.
 */

class CacheService {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();

        // Cache hit/miss stats for monitoring
        this.stats = { hits: 0, misses: 0, sets: 0 };
    }

    /**
     * Get a value from cache.
     * @param {string} key
     * @returns {any|null} Cached value or null if miss
     */
    get(key) {
        if (this.cache.has(key)) {
            this.stats.hits++;
            return this.cache.get(key);
        }
        this.stats.misses++;
        return null;
    }

    /**
     * Set a value in cache with optional TTL.
     * @param {string} key
     * @param {any} value
     * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5min)
     */
    set(key, value, ttlSeconds = 300) {
        // Clear existing timer if re-setting
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        this.cache.set(key, value);
        this.stats.sets++;

        // Auto-expire after TTL
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttlSeconds * 1000);

        this.timers.set(key, timer);
    }

    /**
     * Delete a specific key from cache.
     * @param {string} key
     */
    del(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.cache.delete(key);
    }

    /**
     * Invalidate all keys matching a pattern prefix.
     * Example: invalidatePattern("leaderboard") clears "leaderboard:global", "leaderboard:weekly"
     * @param {string} pattern - Prefix to match
     */
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(pattern)) {
                this.del(key);
            }
        }
    }

    /**
     * Clear entire cache.
     */
    flush() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.cache.clear();
        this.timers.clear();
    }

    /**
     * Get cache statistics for monitoring.
     */
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: this.stats.hits + this.stats.misses > 0
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + "%"
                : "0%",
        };
    }
}

// Singleton instance — shared across the application
module.exports = new CacheService();
