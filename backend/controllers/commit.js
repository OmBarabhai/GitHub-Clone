const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../config/supabaseClient");

async function commitRepo(argv) {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");

    // 1. Check if repo exists locally
    try {
      await fs.access(repoPath);
    } catch {
      console.error("❌ No repository found. Run 'init' first.");
      return;
    }

    // 2. Read repo ID
    const config = JSON.parse(
      await fs.readFile(path.join(repoPath, "config.json"), "utf-8")
    );
    const repositoryId = config.repositoryId;
    if (!repositoryId) {
      console.error("❌ Repository ID missing in config.json");
      return;
    }

    // 3. Get staged files
    const { data: stagedFiles, error: fetchError } = await supabase
      .from("staged_files")
      .select("*")
      .eq("repo_id", repositoryId);

    if (fetchError) throw fetchError;
    if (!stagedFiles?.length) {
      console.warn("⚠️ No files in staging area. Nothing to commit.");
      return;
    }

    // 4. Insert commit record
    const { data: commitData, error: commitError } = await supabase
      .from("commits")
      .insert([{ repository_id: repositoryId, message: argv.message }])
      .select("id")
      .single();

    if (commitError) throw commitError;
    const commitId = commitData.id;

    // 5. Create commit folder locally
    const commitFolder = path.join(commitsPath, commitId);
    await fs.mkdir(commitFolder, { recursive: true });
    await fs.writeFile(path.join(commitFolder, "message.txt"), argv.message);

    // 6. Save files locally + insert into commit_files
    for (const file of stagedFiles) {
      const decodedBuffer = Buffer.from(file.content_base64, "base64");
      
      // WINDOWS PATH FIX: Use split('/') for cross-platform compatibility
      const filePath = path.join(commitFolder, ...file.file_path.split('/'));
      
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, decodedBuffer);

      // Insert into commit_files
      await supabase.from("commit_files").insert({
        commit_id: commitId,
        file_path: file.file_path,
        file_name: file.file_name,
        content: file.content_base64,
        encoding: "base64"
      });
    }

    // 7. Clear staging area
    await supabase
      .from("staged_files")
      .delete()
      .eq("repo_id", repositoryId);

    console.log(`✅ Commit created: ${commitId}`);
    console.log(`📜 Message: ${argv.message}`);
  } catch (err) {
    console.error("❌ Error during commit:", err.message);
  }
}

module.exports = { commitRepo };