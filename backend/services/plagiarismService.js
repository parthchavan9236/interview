/**
 * Plagiarism Detection Service
 * ----------------------------
 * Uses token-based N-gram Jaccard similarity to compare code submissions.
 *
 * Algorithm:
 * 1. Normalize code (strip comments, whitespace, variable names)
 * 2. Tokenize into meaningful chunks
 * 3. Generate N-grams (sequences of N tokens)
 * 4. Compute Jaccard similarity: |A ∩ B| / |A ∪ B|
 *
 * This approach is scalable — the algorithm can be swapped for more
 * sophisticated methods (AST-based, Moss, etc.) without changing the interface.
 */

const Submission = require("../models/Submission");
const PlagiarismReport = require("../models/PlagiarismReport");
const { createNotification } = require("../controllers/notificationController");

const SIMILARITY_THRESHOLD = 80; // Percentage above which a submission is flagged
const NGRAM_SIZE = 4; // Size of n-grams for comparison
const MAX_COMPARISONS = 20; // Max previous submissions to compare against

/**
 * Normalize code by stripping noise that doesn't affect logic.
 * - Remove single-line and multi-line comments
 * - Collapse whitespace
 * - Remove string literals (replace with placeholder)
 * - Lowercase everything
 */
function normalizeCode(code) {
    return code
        .replace(/\/\/.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/#.*$/gm, "") // Remove Python comments
        .replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '"STR"') // Replace string literals
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim()
        .toLowerCase();
}

/**
 * Tokenize code into meaningful tokens.
 */
function tokenize(code) {
    // Split on operators, punctuation, and whitespace, keeping tokens
    return code
        .split(/([{}()\[\];,=+\-*/<>!&|^~%?:.\s]+)/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

/**
 * Generate n-grams from an array of tokens.
 */
function generateNgrams(tokens, n = NGRAM_SIZE) {
    const ngrams = new Set();
    for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.add(tokens.slice(i, i + n).join("|"));
    }
    return ngrams;
}

/**
 * Compute Jaccard similarity between two sets of n-grams.
 * Returns a percentage (0-100).
 */
function jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;

    let intersection = 0;
    for (const item of setA) {
        if (setB.has(item)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

/**
 * Main: Check a submission for plagiarism against recent submissions for the same problem.
 * Called asynchronously after a submission is created.
 *
 * @param {string} submissionId - The ID of the new submission
 * @returns {Array} Array of PlagiarismReport documents that were created
 */
async function checkPlagiarism(submissionId) {
    try {
        const submission = await Submission.findById(submissionId);
        if (!submission) return [];

        // Get recent accepted submissions for the same problem (by different users)
        const previousSubmissions = await Submission.find({
            problem: submission.problem,
            user: { $ne: submission.user },
            status: "accepted",
            isDeleted: false,
            _id: { $ne: submissionId },
        })
            .sort({ createdAt: -1 })
            .limit(MAX_COMPARISONS)
            .lean();

        if (previousSubmissions.length === 0) return [];

        // Prepare current submission's n-grams
        const normalizedCurrent = normalizeCode(submission.code);
        const tokensCurrent = tokenize(normalizedCurrent);
        const ngramsCurrent = generateNgrams(tokensCurrent);

        const reports = [];

        for (const prev of previousSubmissions) {
            const normalizedPrev = normalizeCode(prev.code);
            const tokensPrev = tokenize(normalizedPrev);
            const ngramsPrev = generateNgrams(tokensPrev);

            const similarity = jaccardSimilarity(ngramsCurrent, ngramsPrev);

            // Only create a report for notable similarity (> 30%)
            if (similarity > 30) {
                const isFlagged = similarity >= SIMILARITY_THRESHOLD;

                const report = await PlagiarismReport.create({
                    submission: submissionId,
                    comparedWith: prev._id,
                    similarityPercentage: similarity,
                    isFlagged,
                    algorithm: "ngram-jaccard",
                    details: {
                        ngramSize: NGRAM_SIZE,
                        currentTokenCount: tokensCurrent.length,
                        comparedTokenCount: tokensPrev.length,
                        threshold: SIMILARITY_THRESHOLD,
                    },
                });

                reports.push(report);

                // If flagged, update the submission and notify
                if (isFlagged) {
                    await Submission.findByIdAndUpdate(submissionId, {
                        isFlagged: true,
                        flagReason: `Code similarity ${similarity}% with submission ${prev._id}`,
                    });

                    // Notify the user
                    await createNotification({
                        user: submission.user,
                        type: "PLAGIARISM_FLAG",
                        title: "Submission Flagged",
                        message: `Your submission has been flagged for ${similarity}% code similarity with another submission.`,
                        metadata: { submissionId, similarity },
                    });
                }
            }
        }

        return reports;
    } catch (error) {
        console.error("Plagiarism check failed:", error.message);
        return [];
    }
}

module.exports = { checkPlagiarism, normalizeCode, tokenize, generateNgrams, jaccardSimilarity };
