const express = require("express");
const router = express.Router();
const { addComment, getComments } = require("../controllers/commentController");
const { protectRoute } = require("../middleware/auth");

router.post("/", protectRoute, addComment);
router.get("/:problemId", protectRoute, getComments);

module.exports = router;
