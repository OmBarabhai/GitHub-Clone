const fs = require("fs").promises;
const path = require("path");
// Correct import with destructuring
const { supabaseAdmin } = require("../config/supabaseClient");

async function addRepo(argv) {
  try {
    const fileToAdd = path.resolve(process.cwd(), argv.file);
    const fileName = path.basename(fileToAdd);

    // Get repo config
    const configPath = path.resolve(process.cwd(), ".apnaGit", "config.json");
    const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

    if (!config.repositoryId) {
      throw new Error("Repository ID missing in config.json");
    }

    console.log(`📦 Adding file to repository: ${config.repositoryId}`);

    // Read file content
    let content;
    try {
      content = await fs.readFile(fileToAdd);
    } catch {
      console.warn(`⚠️ File not found. Creating dummy file: ${fileName}`);
      content = Buffer.from("# New File\nCreated by ApnaGit", "utf-8");
    }

    const relativePath = path.relative(process.cwd(), fileToAdd).replace(/\\/g, "/");

    // Use supabaseAdmin to bypass RLS
    const { error } = await supabaseAdmin
      .from("staged_files")
      .upsert({
        repo_id: config.repositoryId,
        file_path: relativePath,
        file_name: fileName,
        content_base64: content.toString("base64"),
        encoding: "base64"
      }, { onConflict: ["repo_id", "file_path"] });

    if (error) throw error;

    console.log(`✅ Staged: ${relativePath}`);
  } catch (err) {
    console.error("❌ Add failed:", err.message);
  }
}

module.exports = { addRepo };