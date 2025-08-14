// routes/issue.router.js

const express = require("express");
const router = express.Router();
const issueController = require("../controllers/issueController");
const { authenticate, authorizeSelfOrAdmin } = require("../middleware/authMiddleware");

// ✅ Create a new issue
router.post("/", authenticate, issueController.createIssue);

// ✅ Get all issues (admin can see all, user can see own)
router.get("/", authenticate, issueController.getAllIssues);

// ✅ Get single issue by ID
router.get("/:id", authenticate, authorizeSelfOrAdmin, issueController.getIssueById);

// ✅ Update issue by ID
router.put("/:id", authenticate, authorizeSelfOrAdmin, issueController.updateIssue);

// ✅ Delete issue by ID
router.delete("/:id", authenticate, authorizeSelfOrAdmin, issueController.deleteIssue);

module.exports = router;
