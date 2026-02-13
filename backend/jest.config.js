module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],
    setupFilesAfterSetup: ["./tests/setup.js"],
    collectCoverageFrom: [
        "controllers/**/*.js",
        "services/**/*.js",
        "middleware/**/*.js",
        "!**/node_modules/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "clover"],
    coverageThresholds: {
        global: {
            branches: 50,
            functions: 50,
            lines: 60,
            statements: 60,
        },
    },
    testTimeout: 30000,
    verbose: true,
};
