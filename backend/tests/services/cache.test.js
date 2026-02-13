/**
 * Cache Service Tests
 */

const CacheService = require("../../services/cacheService");

describe("CacheService", () => {
    beforeEach(() => {
        CacheService.flush();
    });

    test("should set and get a value", () => {
        CacheService.set("test-key", { data: "hello" });
        const result = CacheService.get("test-key");
        expect(result).toEqual({ data: "hello" });
    });

    test("should return null for missing key", () => {
        const result = CacheService.get("nonexistent");
        expect(result).toBeNull();
    });

    test("should delete a key", () => {
        CacheService.set("del-key", "value");
        CacheService.del("del-key");
        expect(CacheService.get("del-key")).toBeNull();
    });

    test("should invalidate by pattern", () => {
        CacheService.set("leaderboard:global", "a");
        CacheService.set("leaderboard:weekly", "b");
        CacheService.set("user:123", "c");

        CacheService.invalidatePattern("leaderboard");

        expect(CacheService.get("leaderboard:global")).toBeNull();
        expect(CacheService.get("leaderboard:weekly")).toBeNull();
        expect(CacheService.get("user:123")).toBe("c");
    });

    test("should track hit/miss stats", () => {
        CacheService.set("stat-key", "val");
        CacheService.get("stat-key");   // hit
        CacheService.get("miss-key");   // miss

        const stats = CacheService.getStats();
        expect(stats.hits).toBeGreaterThanOrEqual(1);
        expect(stats.misses).toBeGreaterThanOrEqual(1);
        expect(stats.size).toBe(1);
    });

    test("should flush all entries", () => {
        CacheService.set("a", 1);
        CacheService.set("b", 2);
        CacheService.flush();

        expect(CacheService.get("a")).toBeNull();
        expect(CacheService.get("b")).toBeNull();
        expect(CacheService.getStats().size).toBe(0);
    });
});
