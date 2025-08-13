// controllers/log.js
const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function logRepo() {
  try {
    // 1. Get current repo config
    const configPath = path.resolve(process.cwd(), ".apnaGit", "config.json");
    let config;
    try {
      config = JSON.parse(await fs.readFile(configPath, "utf-8"));
    } catch {
      console.error("❌ No repository config found. Run 'init' first.");
      return;
    }

    const repositoryId = config.repositoryId;
    if (!repositoryId) {
      console.error("❌ Repository ID missing in config.json");
      return;
    }

    // 2. Fetch commits for this repository
    const { data, error } = await supabase
      .from("commits")
      .select("id, message, created_at")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching commits:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log("ℹ️ No commits found for this repository.");
      return;
    }

    // 3. Display commits
    console.table(
      data.map(commit => ({
        CommitID: commit.id,
        Message: commit.message,
        Date: new Date(commit.created_at).toLocaleString(),
      }))
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
}

module.exports = { logRepo };
