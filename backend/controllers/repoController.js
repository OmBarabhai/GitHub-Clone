// controllers/repoController.js

const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// ✅ Create a new repository
const createRepo = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    const owner_id = req.user.id; // from JWT

    const { data, error } = await supabase
      .from("repositories")
      .insert([{ name, description, visibility, owner_id }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "Repository created successfully",
      data: data[0],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all repositories for a user
const getAllRepos = async (req, res) => {
  try {
    const owner_id = req.user.id; // from JWT

    const { data, error } = await supabase
      .from("repositories")
      .select("*")
      .eq("owner_id", owner_id);

    if (error) throw error;

    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get a single repository by ID
const getRepoById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("repositories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Only owner or admin can access
    if (req.user.id !== data.owner_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update repository
const updateRepo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, visibility } = req.body;

    // Check ownership first
    const { data: repo, error: fetchError } = await supabase
      .from("repositories")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (req.user.id !== repo.owner_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data, error } = await supabase
      .from("repositories")
      .update({ name, description, visibility })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Repository updated successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete repository
const deleteRepo = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: repo, error: fetchError } = await supabase
      .from("repositories")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (req.user.id !== repo.owner_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { error } = await supabase.from("repositories").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Repository deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createRepo,
  getAllRepos,
  getRepoById,
  updateRepo,
  deleteRepo,
};
