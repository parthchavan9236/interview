/**
 * Recommendation Service Tests
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});
afterEach(async () => {
    const colls = mongoose.connection.collections;
    for (const key in colls) await colls[key].deleteMany({});
});
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const RecommendationService = require("../../services/recommendationService");
const UserPerformanceMetrics = require("../../models/UserPerformanceMetrics");
const User = require("../../models/User");
const Problem = require("../../models/Problem");

describe("RecommendationService", () => {
    let userId;

    beforeEach(async () => {
        const user = await User.create({
            name: "Test User",
            email: `test${Date.now()}@test.com`,
            password: "password123",
        });
        userId = user._id;
    });

    test("should create metrics on first update", async () => {
        const submission = {
            status: "accepted",
            executionTime: 150,
        };
        const problem = {
            difficulty: "Easy",
            tags: ["Arrays"],
        };

        const metrics = await RecommendationService.updateMetrics(userId, submission, problem);

        expect(metrics).toBeDefined();
        expect(metrics.totalSubmissions).toBe(1);
        expect(metrics.correctSubmissions).toBe(1);
        expect(metrics.accuracy).toBe(100);
        expect(metrics.solvedByDifficulty.Easy).toBe(1);
    });

    test("should track topic strengths", async () => {
        const submission = { status: "accepted", executionTime: 200 };
        const problem = { difficulty: "Easy", tags: ["Arrays", "Sorting"] };

        const metrics = await RecommendationService.updateMetrics(userId, submission, problem);

        expect(metrics.topicStrengths.length).toBe(2);
        const arrayTopic = metrics.topicStrengths.find(t => t.topic === "Arrays");
        expect(arrayTopic.accuracy).toBe(100);
        expect(arrayTopic.totalAttempts).toBe(1);
    });

    test("should calculate performance score", async () => {
        // Submit multiple times to build metrics
        for (let i = 0; i < 3; i++) {
            await RecommendationService.updateMetrics(userId,
                { status: "accepted", executionTime: 100 },
                { difficulty: "Easy", tags: ["Arrays"] }
            );
        }

        const metrics = await UserPerformanceMetrics.findOne({ userId });
        expect(metrics.performanceScore).toBeGreaterThan(0);
        expect(metrics.performanceScore).toBeLessThanOrEqual(100);
    });

    test("should return performance stats with defaults for new user", async () => {
        const newUser = await User.create({
            name: "New User",
            email: `new${Date.now()}@test.com`,
            password: "password123",
        });

        const stats = await RecommendationService.getPerformanceStats(newUser._id);
        expect(stats.performanceScore).toBe(0);
        expect(stats.accuracy).toBe(0);
        expect(stats.currentRecommendedDifficulty).toBe("Easy");
    });

    test("should get recommendations", async () => {
        // Create test problems
        await Problem.create([
            { title: "Two Sum", description: "Find two numbers", difficulty: "Easy", tags: ["Arrays"], testCases: [{ input: "1", expectedOutput: "2" }] },
            { title: "Three Sum", description: "Find three numbers", difficulty: "Medium", tags: ["Arrays"], testCases: [{ input: "1", expectedOutput: "2" }] },
        ]);

        const result = await RecommendationService.getRecommendations(userId, 5);
        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
    });
});
