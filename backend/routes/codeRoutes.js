const express = require("express");
const router = express.Router();
const { executeCode, getLanguages } = require("../controllers/codeController");
const { protectRoute } = require("../middleware/auth");

router.post("/execute", protectRoute, executeCode);
router.get("/languages", getLanguages);

module.exports = router;
