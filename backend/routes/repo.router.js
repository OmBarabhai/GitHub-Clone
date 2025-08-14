// routes/repo.router.js

const express = require("express");
const router = express.Router();
const repoController = require("../controllers/repoController");
const {
  authenticate,
  authorizeOwnerOrAdmin,
} = require("../middleware/authMiddleware");
const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// Generic function to get repo owner ID for authorization
const getRepoOwnerId = async (req) => {
  const { id } = req.params;
  const { data: repo, error } = await supabase
    .from("repositories")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (error || !repo) throw new Error("Repository not found");
  return repo.owner_id;
};

// Routes

router.post("/", authenticate, repoController.createRepo);
router.get("/", authenticate, repoController.getAllRepos);
router.get("/:id", authenticate, repoController.getRepoById);

// Update and Delete require owner or admin
router.put(
  "/:id",
  authenticate,
  authorizeOwnerOrAdmin(getRepoOwnerId),
  repoController.updateRepo
);
router.delete(
  "/:id",
  authenticate,
  authorizeOwnerOrAdmin(getRepoOwnerId),
  repoController.deleteRepo
);

module.exports = router;
