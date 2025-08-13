const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function pullRepo() {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");

    // 1. Read config to get repo ID
    const configRaw = await fs.readFile(path.join(repoPath, "config.json"), "utf-8");
    const config = JSON.parse(configRaw);
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

    if (commitsError) {
      console.error("❌ Error fetching commits:", commitsError.message);
      return;
    }
    if (!commits || commits.length === 0) {
      console.log("⚠️ No commits found in remote repository.");
      return;
    }

    // 3. Process each commit
    for (const commit of commits) {
      const commitFolder = path.join(commitsPath, commit.id);
      await fs.rm(commitFolder, { recursive: true, force: true });
      await fs.mkdir(commitFolder, { recursive: true });

      // Save commit message
      await fs.writeFile(
        path.join(commitFolder, "message.txt"),
        commit.message || ""
      );

      // Fetch commit files
      const { data: files, error: filesError } = await supabase
        .from("commit_files")
        .select("*")
        .eq("commit_id", commit.id);

      if (filesError) {
        console.error(`❌ Error fetching files for commit ${commit.id}:`, filesError.message);
        continue;
      }

      // Write files
      for (const file of files) {
        // Skip internal files
        if (file.file_path.startsWith(".apnaGit")) continue;

        const destPath = path.join(commitFolder, file.file_path);
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        let fileBuffer;
        if (file.encoding === "base64") {
          // Decode binary/text from Base64
          fileBuffer = Buffer.from(file.content, "base64");
        } else {
          // Assume UTF-8 text if encoding not set
          fileBuffer = Buffer.from(file.content, "utf-8");
        }

        await fs.writeFile(destPath, fileBuffer);
      }

      console.log(`✅ Pulled commit ${commit.id}`);
    }

    console.log("🎉 Finished pulling all commits from remote Supabase.");
  } catch (err) {
    console.error("❌ Error pulling from remote:", err.message);
  }
}

module.exports = { pullRepo };
