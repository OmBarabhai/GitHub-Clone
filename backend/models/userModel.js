const { supabase } = require("../supabaseClient");

// Create a new user
async function createUser(username, email, password) {
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, email, password }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get a user by username
async function getUserByUsername(username) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) throw error;
  return data;
}

// Follow another user
async function followUser(followerId, followedId) {
  const { error } = await supabase
    .from("followed_users")
    .insert([{ follower_id: followerId, followed_id: followedId }]);

  if (error) throw error;
  return { success: true };
}

// Star a repository
async function starRepository(userId, repoId) {
  const { error } = await supabase
    .from("starred_repos")
    .insert([{ user_id: userId, repo_id: repoId }]);

  if (error) throw error;
  return { success: true };
}

module.exports = {
  createUser,
  getUserByUsername,
  followUser,
  starRepository
};
