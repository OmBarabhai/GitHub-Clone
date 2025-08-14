// controllers/issueController.js

const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// ✅ Create a new issue
const createIssue = async (req, res) => {
  try {
    const { title, description, repo_id, status } = req.body;
    const user_id = req.user.id; // from JWT

    const { data, error } = await supabase
      .from("issues")
      .insert([{ title, description, repo_id, status, user_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Issue created successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all issues for a repository
const getAllIssues = async (req, res) => {
  try {
    const { repo_id } = req.params;

    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("repo_id", repo_id);

    if (error) throw error;

    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get single issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Only issue creator or admin can access
    if (req.user.id !== data.user_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const { data: issue, error: fetchError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (req.user.id !== issue.user_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data, error } = await supabase
      .from("issues")
      .update({ title, description, status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Issue updated successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: issue, error: fetchError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (req.user.id !== issue.user_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { error } = await supabase.from("issues").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
