const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../config/supabaseClient");

async function pushRepo() {
  try {
    console.log("🚀 Starting push to Supabase...");
    
    // 1. Get repository config
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const configPath = path.join(repoPath, "config.json");
    const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
    
    if (!config.repositoryId) {
      throw new Error("❌ Repository ID missing in config.json");
    }
    console.log(`📦 Repository ID: ${config.repositoryId}`);

    // 2. Get local commits not in Supabase
    const { data: existingCommits, error: fetchError } = await supabase
      .from("commits")
      .select("id")
      .eq("repository_id", config.repositoryId);

    if (fetchError) throw fetchError;
    
    const existingCommitIds = existingCommits.map(c => c.id);
    const commitFolders = await fs.readdir(path.join(repoPath, "commits"));
    const localCommitIds = commitFolders.filter(id => 
      !existingCommitIds.includes(id)
    );
    
    if (localCommitIds.length === 0) {
      console.log("✅ All commits already pushed to Supabase");
      return;
    }
    console.log(`📤 Found ${localCommitIds.length} commits to push`);

    // 3. Process each commit
    for (const commitId of localCommitIds) {
      console.log(`⬆️ Pushing commit: ${commitId}`);
      const commitPath = path.join(repoPath, "commits", commitId);
      
      // 3a. Get commit message
      const messagePath = path.join(commitPath, "message.txt");
      let message = "";
      try {
        message = await fs.readFile(messagePath, "utf-8");
      } catch {
        console.warn(`⚠️ No message.txt for commit ${commitId}, using default`);
        message = "No commit message";
      }

      // 3b. Insert commit record
      const { error: commitError } = await supabase.from("commits").insert({
        id: commitId,
        repository_id: config.repositoryId,
        message: message.trim(),
        created_at: new Date().toISOString()
      });
      
      if (commitError) {
        if (commitError.code === "23505") { // Unique violation
          console.warn(`⚠️ Commit ${commitId} already exists in Supabase`);
          continue;
        }
        throw commitError;
      }

      // 3c. Get all files in commit
      const files = await getAllFiles(commitPath);
      
      // 3d. Process each file
      for (const filePath of files) {
        // Skip message file
        if (filePath.includes("message.txt")) continue;
        
        // Get relative path
        const relativePath = path.relative(commitPath, filePath)
          .replace(/\\/g, "/"); // Standardize paths
        
        // Read and encode file
        const content = await fs.readFile(filePath);
        const contentBase64 = content.toString("base64");
        
        // Insert file record
        const { error: fileError } = await supabase.from("commit_files").insert({
          commit_id: commitId,
          file_path: relativePath,
          content: contentBase64,
          encoding: "base64"
        });
        
        if (fileError) {
          console.error(`❌ Error pushing file ${relativePath}:`, fileError.message);
        }
      }
      console.log(`✅ Pushed commit ${commitId} with ${files.length} files`);
    }
    
    console.log("🎉 All commits pushed successfully!");
  } catch (err) {
    console.error("❌ Push failed:", err.message);
  }
}

// Helper to get all files recursively
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
  }));
  return files.flat();
}

module.exports = { pushRepo };