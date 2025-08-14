// routes/main.router.js

const express = require("express");
const router = express.Router();

// Import all sub-routers
const userRouter = require("./user.router");
const repoRouter = require("./repo.router");
const issueRouter = require("./issue.router");

// Mount routers
router.use("/users", userRouter);
router.use("/repos", repoRouter);
router.use("/issues", issueRouter);

// Root route
router.get("/", (req, res) => {
  res.json({ message: "API is running!" });
});

module.exports = router;
