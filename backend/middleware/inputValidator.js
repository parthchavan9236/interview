/**
 * Input Validator Middleware
 * =========================
 * Reusable validation schemas using express-validator.
 * Provides pre-built validation chains for common endpoint patterns.
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Middleware to check validation results.
 * Use after validation chains: router.post("/", validateSubmission, handleValidation, controller)
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// ── Validation Chains ──

const validateObjectId = (field, location = "params") => {
    const validator = location === "params" ? param(field) : body(field);
    return validator
        .isMongoId()
        .withMessage(`${field} must be a valid MongoDB ObjectId`);
};

const validateSubmission = [
    body("code").notEmpty().withMessage("Code is required"),
    body("language").isIn(["javascript", "python"]).withMessage("Language must be javascript or python"),
    body("problemId").isMongoId().withMessage("Valid problem ID is required"),
];

const validateProblem = [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("difficulty").isIn(["Easy", "Medium", "Hard"]).withMessage("Difficulty must be Easy, Medium, or Hard"),
    body("testCases").isArray({ min: 1 }).withMessage("At least one test case is required"),
];

const validateAuth = [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const validateRegister = [
    body("name").trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
    ...validateAuth,
    body("role").optional().isIn(["candidate", "interviewer"]).withMessage("Invalid role"),
];

const validateContest = [
    body("title").trim().notEmpty().withMessage("Contest title is required"),
    body("startTime").isISO8601().withMessage("Valid start time is required"),
    body("endTime").isISO8601().withMessage("Valid end time is required"),
    body("problems").isArray({ min: 1 }).withMessage("At least one problem is required"),
];

const validateOrganization = [
    body("name").trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage("Organization name is required"),
    body("slug").trim().notEmpty().isSlug().withMessage("Slug must be URL-friendly"),
];

const validateBehaviorTrack = [
    body("sessionId").notEmpty().withMessage("Session ID is required"),
    body("typingSpeed").optional().isNumeric().withMessage("Typing speed must be a number"),
    body("tabSwitchCount").optional().isInt({ min: 0 }).withMessage("Tab switch count must be non-negative"),
    body("copyPasteCount").optional().isInt({ min: 0 }).withMessage("Copy paste count must be non-negative"),
];

const validateAIInterview = [
    body("topic").trim().notEmpty().withMessage("Interview topic is required"),
    body("difficulty").optional().isIn(["Easy", "Medium", "Hard"]).withMessage("Invalid difficulty"),
    body("interviewType").optional().isIn(["dsa", "system_design", "behavioral", "frontend", "backend", "general"])
        .withMessage("Invalid interview type"),
];

const validatePagination = [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be ≥ 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
];

module.exports = {
    handleValidation,
    validateObjectId,
    validateSubmission,
    validateProblem,
    validateAuth,
    validateRegister,
    validateContest,
    validateOrganization,
    validateBehaviorTrack,
    validateAIInterview,
    validatePagination,
};
