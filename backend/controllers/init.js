const fs = require("fs").promises;
const path = require("path");
const supabase = require("../config/supabaseClient");

async function initRepo() {
  const repoPath = path.resolve(process.cwd(), ".apnaGit");
  const configPath = path.join(repoPath, "config.json");

  try {
    // Check if repo exists locally
    try {
      await fs.access(configPath);
      const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
      console.log("✅ Repository already exists:", repoPath);
      console.log(`🆔 Repository ID: ${config.repositoryId}`);
      return;
    } catch {}

    // Create new repo in Supabase
    const repoName = path.basename(process.cwd());
    const { data, error } = await supabase
      .from("repositories")
      .insert([{ name: repoName }])
      .select("id")
      .single();

    if (error) throw error;
    
    // Create local directories
    await fs.mkdir(repoPath, { recursive: true });
    
    // Save config
    const configData = { repositoryId: data.id };
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

    console.log(`✅ Repository initialized: ${repoPath}`);
    console.log(`🆔 Repository ID: ${data.id}`);
  } catch (err) {
    console.error("❌ Initialization failed:", err.message);
    process.exit(1);
  }
}

module.exports = { initRepo };