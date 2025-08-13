const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Collection routes
router.get("/", userController.getAllUsers);
router.post("/", userController.signup);
router.post("/login", userController.login);

// Resource routes
router.get("/:id", userController.getUserProfile);
router.put("/:id", userController.updateUserProfile);
router.delete("/:id", userController.deleteUserProfile);

module.exports = router;