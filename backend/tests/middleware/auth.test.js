/**
 * Auth Middleware Tests
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

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

const { protectRoute, protectAdmin, protectInterviewer } = require("../../middleware/auth");
const User = require("../../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "codeinterview_jwt_secret_key_2026";

// Mock Express req/res/next
const mockReq = (headers = {}, user = null) => ({
    headers,
    user,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe("protectRoute", () => {
    beforeEach(() => jest.clearAllMocks());

    test("should reject request without token", async () => {
        const req = mockReq({});
        const res = mockRes();

        await protectRoute(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject request with invalid token", async () => {
        const req = mockReq({ authorization: "Bearer invalid_token" });
        const res = mockRes();

        await protectRoute(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("should accept request with valid JWT", async () => {
        const user = await User.create({
            name: "Auth Test",
            email: `auth${Date.now()}@test.com`,
            password: "password123",
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        const req = mockReq({ authorization: `Bearer ${token}` });
        const res = mockRes();

        await protectRoute(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user._id.toString()).toBe(user._id.toString());
    });
});

describe("protectAdmin", () => {
    beforeEach(() => jest.clearAllMocks());

    test("should allow admin users", () => {
        const req = mockReq({}, { role: "admin" });
        const res = mockRes();

        protectAdmin(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    test("should reject non-admin users", () => {
        const req = mockReq({}, { role: "candidate" });
        const res = mockRes();

        protectAdmin(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
    });
});

describe("protectInterviewer", () => {
    beforeEach(() => jest.clearAllMocks());

    test("should allow interviewer users", () => {
        const req = mockReq({}, { role: "interviewer" });
        const res = mockRes();

        protectInterviewer(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    test("should allow admin users as interviewers", () => {
        const req = mockReq({}, { role: "admin" });
        const res = mockRes();

        protectInterviewer(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    test("should reject candidate users", () => {
        const req = mockReq({}, { role: "candidate" });
        const res = mockRes();

        protectInterviewer(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
    });
});
