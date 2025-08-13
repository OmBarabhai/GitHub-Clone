const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function addRepo(argv) {
  try {
    const fileToAdd = path.resolve(process.cwd(), argv.file);
    const fileName = path.basename(fileToAdd);

    let contentBuffer;
    try {
      contentBuffer = await fs.readFile(fileToAdd); // buffer for both text & binary
    } catch {
      console.warn(`⚠️ File not found. Creating dummy file.`);
      contentBuffer = Buffer.from("This is a dummy file for testing.\n", "utf-8");
    }

    const contentBase64 = contentBuffer.toString("base64");

    const configPath = path.resolve(process.cwd(), ".apnaGit", "config.json");
    let config;
    try {
      config = JSON.parse(await fs.readFile(configPath, "utf-8"));
    } catch {
      console.error("❌ Could not read repository config. Run 'init' first.");
      return;
    }

    const repo_id = config.repositoryId;
    if (!repo_id) {
      console.error("❌ Repository ID missing in config.json");
      return;
    }

    const relativePath = path.relative(process.cwd(), fileToAdd).replace(/\\/g, "/");

    const { error } = await supabase.from("staged_files").upsert({
      repo_id,
      file_name: fileName,
      file_path: relativePath,
      content_base64: contentBase64,
      encoding: "base64",
      staged_at: new Date().toISOString()
    }, { onConflict: ["repo_id", "file_path"] });

    if (error) {
      console.error("❌ Error adding file:", error.message);
      return;
    }

    console.log(`✅ Added '${relativePath}' to staging area.`);
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
}

module.exports = { addRepo };
