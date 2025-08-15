const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeSelfOrAdmin } = require("../middleware/auth");

router.get("/", authenticateToken, userController.getAllUsers);
router.get("/:id", authenticateToken, userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", authenticateToken, authorizeSelfOrAdmin, userController.updateUser);
router.delete("/:id", authenticateToken, authorizeSelfOrAdmin, userController.deleteUser);

// Add login route
router.post('/login', userController.loginUser);

module.exports = router;