const express = require("express");
const userRouter = require("./userRouter"); // Capital "R"

const mainRouter = express.Router();

mainRouter.use("/api/users", userRouter);

mainRouter.get("/", (req, res) => {
  res.send("ApnaGit Server is running!");
});

module.exports = mainRouter;