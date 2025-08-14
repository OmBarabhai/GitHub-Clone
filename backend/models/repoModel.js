const { supabase, supabaseAdmin } = require("../config/supabaseClient");

// Create a new repository
async function createRepository(ownerId, name) {
  const { data, error } = await supabase
    .from("repositories")
    .insert([{ owner_id: ownerId, name }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all repositories for a user
async function getRepositoriesByOwner(ownerId) {
  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("owner_id", ownerId);

  if (error) throw error;
  return data;
}

// Get repository by ID
async function getRepositoryById(repoId) {
  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("id", repoId)
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createRepository,
  getRepositoriesByOwner,
  getRepositoryById,
};
