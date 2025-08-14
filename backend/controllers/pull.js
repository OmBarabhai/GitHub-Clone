const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../config/supabaseClient");

async function pullRepo() {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");

    // 1. Read config to get repo ID
    const config = JSON.parse(
      await fs.readFile(path.join(repoPath, "config.json"), "utf-8")
    );
    const repositoryId = config.repositoryId;
    if (!repositoryId) {
      console.error("❌ Repository ID missing in config.json");
      return;
    }

    // 2. Fetch all commits from Supabase
    const { data: commits, error: commitsError } = await supabase
      .from("commits")
      .select("*")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: true });

    if (commitsError) throw commitsError;
    if (!commits?.length) {
      console.log("⚠️ No commits found in remote repository.");
      return;
    }

    // 3. Process each commit
    for (const commit of commits) {
      const commitFolder = path.join(commitsPath, commit.id);
      await fs.rm(commitFolder, { recursive: true, force: true });
      await fs.mkdir(commitFolder, { recursive: true });

      await fs.writeFile(
        path.join(commitFolder, "message.txt"),
        commit.message || ""
      );

      // 4. Fetch commit files
      const { data: files, error: filesError } = await supabase
        .from("commit_files")
        .select("*")
        .eq("commit_id", commit.id);

      if (filesError) throw filesError;

      // 5. Write files
      for (const file of files) {
        if (file.file_path.startsWith(".apnaGit")) continue;

        // WINDOWS PATH FIX: Use split('/') for cross-platform compatibility
        const destPath = path.join(commitFolder, ...file.file_path.split('/'));
        
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        const fileBuffer = file.encoding === "base64" 
          ? Buffer.from(file.content, "base64")
          : Buffer.from(file.content, "utf-8");

        await fs.writeFile(destPath, fileBuffer);
      }

      console.log(`✅ Pulled commit ${commit.id}`);
    }

    console.log("🎉 Finished pulling all commits");
  } catch (err) {
    console.error("❌ Error pulling from remote:", err.message);
  }
}

module.exports = { pullRepo };