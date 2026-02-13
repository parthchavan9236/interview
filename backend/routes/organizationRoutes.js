const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/auth");
const { validateOrganization, handleValidation, validatePagination } = require("../middleware/inputValidator");
const {
    createOrganization,
    getOrganization,
    listOrganizations,
    addMember,
    removeMember,
    getOrgLeaderboard,
    getOrgAnalytics,
} = require("../controllers/organizationController");

router.use(protectRoute);

router.post("/", validateOrganization, handleValidation, createOrganization);
router.get("/", validatePagination, handleValidation, listOrganizations);
router.get("/:id", getOrganization);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);
router.get("/:id/leaderboard", getOrgLeaderboard);
router.get("/:id/analytics", getOrgAnalytics);

module.exports = router;
