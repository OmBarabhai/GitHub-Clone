const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function commitRepo(argv) {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");

    // 1. Check if repo exists locally
    try {
      await fs.access(repoPath);
    } catch {
      console.error("❌ No repository found. Run 'node index.js init' first.");
      return;
    }

    // 2. Read repo ID
    let config;
    try {
      config = JSON.parse(await fs.readFile(path.join(repoPath, "config.json"), "utf-8"));
    } catch {
      console.error("❌ Could not read repository config. Have you run 'init'?");
      return;
    }

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

    if (fetchError) {
      console.error("❌ Error fetching staged files:", fetchError.message);
      return;
    }

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

    if (commitError) {
      console.error("❌ Error inserting commit in Supabase:", commitError.message);
      return;
    }

    const commitId = commitData.id;

    // 5. Create commit folder locally
    const commitFolder = path.join(commitsPath, commitId);
    await fs.mkdir(commitFolder, { recursive: true });

    // Save commit message locally
    await fs.writeFile(path.join(commitFolder, "message.txt"), argv.message);

    // 6. Detect actual commit_files schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc("get_table_columns", { table_name: "commit_files" }); // ✅ You'll need this Postgres function

    if (schemaError) {
      console.error("❌ Could not fetch commit_files schema:", schemaError.message);
      return;
    }

    const commitFilesCols = schemaData.map(col => col.column_name);

    // 7. Save files locally + insert into commit_files
    for (const file of stagedFiles) {
      const decodedBuffer = Buffer.from(file.content_base64, "base64");
      const filePath = path.join(commitFolder, file.file_path);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, decodedBuffer);

      // Prepare insert object only with existing DB columns
      const insertObj = { commit_id: commitId };

      if (commitFilesCols.includes("file_name")) insertObj.file_name = file.file_name || path.basename(file.file_path);
      if (commitFilesCols.includes("file_path")) insertObj.file_path = file.file_path;
      if (commitFilesCols.includes("content_base64")) insertObj.content_base64 = file.content_base64;
      if (commitFilesCols.includes("content")) insertObj.content = file.content_base64;
      if (commitFilesCols.includes("encoding")) insertObj.encoding = file.encoding || "base64";

      const { error: fileInsertError } = await supabase
        .from("commit_files")
        .insert([insertObj]);

      if (fileInsertError) {
        console.error(`❌ Error inserting file ${file.file_path}:`, fileInsertError.message);
      }
    }

    // 8. Clear staging area
    const { error: deleteError } = await supabase
      .from("staged_files")
      .delete()
      .eq("repo_id", repositoryId);

    if (deleteError) {
      console.error("❌ Error clearing staged files:", deleteError.message);
      return;
    }

    console.log(`✅ Commit created: ${commitId}`);
    console.log(`📜 Message: ${argv.message}`);

  } catch (err) {
    console.error("❌ Error during commit:", err.message);
  }
}

module.exports = { commitRepo };
