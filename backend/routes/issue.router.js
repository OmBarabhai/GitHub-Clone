const express = require("express");
const router = express.Router();
const issueController = require("../controllers/issueController");
const { authenticate } = require("../middleware/authMiddleware");

// Create issue (requires repo ID in body)
router.post("/", authenticate, issueController.createIssue);

// Get issues for a specific repository
router.get("/repo/:repoId", authenticate, issueController.getIssuesByRepo);

// Get issue by ID
router.get("/:id", authenticate, issueController.getIssueById);

// Update issue
router.put("/:id", authenticate, issueController.updateIssue);

// Delete issue
router.delete("/:id", authenticate, issueController.deleteIssue);

module.exports = router;