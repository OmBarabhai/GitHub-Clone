const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function pushRepo() {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");

    // 1. Read repo ID from config
    const configPath = path.join(repoPath, "config.json");
    const configRaw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configRaw);
    const repositoryId = config.repositoryId;

    if (!repositoryId) {
      console.error("❌ Repository ID missing in config.json");
      return;
    }

    // 2. Get local commits not in Supabase
    const { data: existingCommits, error: fetchError } = await supabase
      .from("commits")
      .select("id")
      .eq("repository_id", repositoryId);

    if (fetchError) throw fetchError;

    const existingCommitIds = existingCommits.map(c => c.id);
    const localCommitIds = (await fs.readdir(commitsPath)).filter(
      id => !existingCommitIds.includes(id)
    );

    // 3. Push new commits to Supabase
    for (const commitId of localCommitIds) {
      const commitPath = path.join(commitsPath, commitId);
      const messagePath = path.join(commitPath, "message.txt");

      // Skip if message file doesn't exist
      try {
        await fs.access(messagePath);
      } catch {
        console.warn(`⚠️ Skipping commit ${commitId}: message.txt not found`);
        continue;
      }

      const message = await fs.readFile(messagePath, "utf-8");

      // Insert commit record
      const { error: commitError } = await supabase
        .from("commits")
        .insert([
          {
            id: commitId,
            repository_id: repositoryId,
            message,
          },
        ]);

      if (commitError) throw commitError;

      // Get all files in commit directory (recursively)
      const files = await getAllFiles(commitPath);

   // Insert files
// Inside your loop where you insert files
for (const filePath of files) {
  // Read as binary buffer (no encoding)
  const buffer = await fs.readFile(filePath);
  const encodedContent = buffer.toString("base64");

  const relativePath = path.relative(commitPath, filePath)
    .replace(/\\/g, '/');

  const { error: fileError } = await supabase
    .from("commit_files")
    .insert([{
      commit_id: commitId,
      file_path: relativePath,
      content: encodedContent,
      encoding: 'base64'
    }]);

  if (fileError) {
    console.error(`❌ Error inserting file ${relativePath}:`, fileError.message);
  }
}
      console.log(`📤 Pushed commit: ${commitId}`);
    }

    console.log("✅ All commits pushed to Supabase");
  } catch (err) {
    console.error("❌ Push failed:", err.message);
  }
}


// Helper to get all files recursively inside a folder
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
    })
  );
  return files.flat();
}

module.exports = { pushRepo };
