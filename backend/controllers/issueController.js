const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// Create issue
const createIssue = async (req, res) => {
  try {
    const { repo_id, title, description } = req.body;
    const author_id = req.user.id; // Get from authenticated user

    // Validate input
    if (!repo_id || !title) {
      return res.status(400).json({ error: "Repository ID and title are required" });
    }

    // Check repo exists and user has access
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select("owner_id, visibility")
      .eq("id", repo_id)
      .single();

    if (repoError) throw repoError;
    if (!repo) return res.status(404).json({ error: "Repository not found" });

    // Check access rights
    if (repo.visibility === "private" && 
        repo.owner_id !== req.user.id && 
        req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create issue
    const { data, error } = await supabase
      .from("issues")
      .insert([{
        repo_id,
        title,
        description,
        author_id,
        status: "open"
      }])
      .select(`
        *,
        users!issues_author_id_fkey (id, username)
      `);

    if (error) throw error;

    res.status(201).json({
      message: "Issue created successfully",
      issue: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get issues by repository
const getIssuesByRepo = async (req, res) => {
  try {
    const { repoId } = req.params;
    
    // First get repo to check visibility
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select("owner_id, visibility")
      .eq("id", repoId)
      .single();

    if (repoError) throw repoError;
    if (!repo) return res.status(404).json({ error: "Repository not found" });

    // Check access rights
    if (repo.visibility === "private" && 
        repo.owner_id !== req.user.id && 
        req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get issues
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        author_id,
        users!issues_author_id_fkey (id, username)
      `)
      .eq("repo_id", repoId)
      .order("created_at", { ascending: false });

    if (issuesError) throw issuesError;

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: issue, error } = await supabase
      .from("issues")
      .select(`
        *,
        users!issues_author_id_fkey (id, username),
        repositories!issues_repo_id_fkey (id, name, owner_id, visibility)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    // Check repo access
    if (issue.repositories.visibility === "private" && 
        issue.repositories.owner_id !== req.user.id && 
        req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // First get the issue to verify authorization
    const { data: existingIssue, error: fetchError } = await supabase
      .from("issues")
      .select("author_id, repo_id, repositories!issues_repo_id_fkey(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Verify current user is author or repo owner/admin
    const isAuthor = existingIssue.author_id === req.user.id;
    const isRepoOwner = existingIssue.repositories.owner_id === req.user.id;
    
    if (!isAuthor && !isRepoOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update issue
    const { data, error } = await supabase
      .from("issues")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        users!issues_author_id_fkey (id, username)
      `);

    if (error) throw error;

    res.json({
      message: "Issue updated successfully",
      issue: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the issue to verify authorization
    const { data: existingIssue, error: fetchError } = await supabase
      .from("issues")
      .select("author_id, repo_id, repositories!issues_repo_id_fkey(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Verify current user is author or repo owner/admin
    const isAuthor = existingIssue.author_id === req.user.id;
    const isRepoOwner = existingIssue.repositories.owner_id === req.user.id;
    
    if (!isAuthor && !isRepoOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { error: deleteError } = await supabase
      .from("issues")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ message: "Issue deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createIssue,
  getIssuesByRepo,
  getIssueById,
  updateIssue,
  deleteIssue
};