const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// Create repository
const createRepo = async (req, res) => {
  try {
    const { name, description, visibility = "public" } = req.body;
    const owner_id = req.user.id; // Get from authenticated user
    
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    const { data, error } = await supabase
      .from("repositories")
      .insert([{ 
        name, 
        description, 
        visibility,
        owner_id 
      }])
      .select();

    if (error) throw error;
    
    res.status(201).json({
      message: "Repository created successfully",
      repo: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all repositories (with visibility filtering)
const getAllRepos = async (req, res) => {
  try {
    let query = supabase.from("repositories").select(`
      id,
      name,
      description,
      visibility,
      created_at,
      owner_id,
      users!repositories_owner_id_fkey (id, username)
    `);

    // Filter based on visibility and ownership
    if (req.user.role !== "admin") {
      query = query.or(`visibility.eq.public,owner_id.eq.${req.user.id}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get repository by ID
const getRepoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select(`
        *,
        users!repositories_owner_id_fkey (id, username)
      `)
      .eq("id", id)
      .single();

    if (repoError) throw repoError;
    if (!repo) return res.status(404).json({ error: "Repository not found" });

    // Check access rights
    if (repo.visibility === "private" && 
        repo.owner_id !== req.user.id && 
        req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update repository
const updateRepo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // First get the repo to verify ownership
    const { data: existingRepo, error: fetchError } = await supabase
      .from("repositories")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingRepo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    // Verify current user is owner or admin
    if (existingRepo.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Prevent changing owner_id unless admin
    if (updates.owner_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can transfer ownership" });
    }

    const { data, error } = await supabase
      .from("repositories")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({
      message: "Repository updated successfully",
      repo: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete repository
const deleteRepo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the repo to verify ownership
    const { data: existingRepo, error: fetchError } = await supabase
      .from("repositories")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingRepo) {
      return res.status(404).json({ error: "Repository not found" });
    }

    // Verify current user is owner or admin
    if (existingRepo.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete related issues first
    await supabaseAdmin
      .from("issues")
      .delete()
      .eq("repo_id", id);

    // Then delete the repo
    const { error: deleteError } = await supabase
      .from("repositories")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ message: "Repository deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get repositories by user
const getReposByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const { data, error } = await supabase
      .from("repositories")
      .select(`
        id,
        name,
        description,
        visibility,
        created_at
      `)
      .eq("owner_id", userId);

    if (error) throw error;

    // Filter private repos if not owner/admin
    const filteredRepos = data.filter(repo => 
      repo.visibility === "public" || 
      userId === req.user.id ||
      req.user.role === "admin"
    );

    res.json(filteredRepos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRepo,
  getAllRepos,
  getRepoById,
  updateRepo,
  deleteRepo,
  getReposByUser
};