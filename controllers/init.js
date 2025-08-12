const fs = require("fs").promises;
const path = require("path");
const { supabase } = require("../supabaseClient");

async function initRepo() {
  const repoPath = path.resolve(process.cwd(), ".apnaGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    // Check if local config exists
    try {
      await fs.access(configPath);
      const configRaw = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(configRaw);
      console.log("✅ Repository already exists at:", repoPath);
      console.log(`🆔 Repository ID: ${config.repositoryId}`);
      return;
    } catch {
      // Local config missing — continue
    }

    const repoName = path.basename(process.cwd());
    let repositoryId;

    // Check if repo exists in Supabase
    const { data: existingRepo, error: fetchError } = await supabase
      .from("repositories")
      .select("id")
      .eq("name", repoName)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error checking existing repositories:", fetchError.message);
      return;
    }

    if (existingRepo) {
      repositoryId = existingRepo.id;
      console.log("🔁 Using existing repository in Supabase");
    } else {
      // Create repo if not found
      const { data, error: createError } = await supabase
        .from("repositories")
        .insert([{ name: repoName }])
        .select("id")
        .single();

      if (createError) {
        console.error("❌ Error creating repository in Supabase:", createError.message);
        return;
      }
      repositoryId = data.id;
    }

    // Always create local repo folders
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });

    // Write config.json
    const bucketName = process.env.S3_BUCKET || "default-bucket";
    const configData = {
      bucket: bucketName,
      repositoryId,
      created: new Date().toISOString()
    };

    await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

    console.log(`✅ Repository initialized at: ${repoPath}`);
    console.log(`🆔 Repository ID: ${repositoryId}`);
    console.log("📦 Config file created with bucket:", bucketName);

  } catch (err) {
    console.error("❌ Error initializing repository:", err.message);
  }
}

module.exports = { initRepo };
