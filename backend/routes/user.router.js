// routes/user.router.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorizeSelfOrAdmin } = require("../middleware/authMiddleware");

// Get all users (admin only)
router.get("/", authenticate, userController.getAllUsers);

// Get single user
router.get("/:id", authenticate, authorizeSelfOrAdmin, userController.getUserProfile);

// Update user
router.put("/:id", authenticate, authorizeSelfOrAdmin, userController.updateUserProfile);

// Delete user
router.delete("/:id", authenticate, authorizeSelfOrAdmin, userController.deleteUserProfile);

module.exports = router;
