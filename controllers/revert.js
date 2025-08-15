const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

async function revertRepo(argv) {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitPath = path.join(repoPath, "commits", argv.commitId);

    // 1. Verify commit exists
    try {
      await fs.access(commitPath);
    } catch {
      throw new Error(`Commit not found: ${argv.commitId}`);
    }

    // 2. Create backup of current working directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(repoPath, "backups", `pre-revert-${timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });
    console.log(`🔒 Creating backup at: ${backupPath}`);
    
    // Backup current working directory
    const filesToBackup = await listFiles(process.cwd(), [".apnaGit"]);
    for (const file of filesToBackup) {
      const relative = path.relative(process.cwd(), file);
      const dest = path.join(backupPath, relative);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(file, dest);
    }

    // 3. Gather commit files
    const commitFiles = await listFiles(commitPath, ["message.txt"]);

    console.log(`⚠️ The following files will be restored from commit ${argv.commitId}:`);
    commitFiles.forEach(file => {
      const relative = path.relative(commitPath, file);
      console.log(`  ↩️ ${relative}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Do you want to proceed? (yes/no) ", async (answer) => {
      rl.close();
      if (answer.toLowerCase() !== "yes") {
        console.log("❌ Revert cancelled by user.");
        return;
      }

      // 4. Restore files safely
      for (const file of commitFiles) {
        const relative = path.relative(commitPath, file);
        const dest = path.join(process.cwd(), relative);
        
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(file, dest);
        console.log(`✅ Restored: ${relative}`);
      }

      console.log(`🎉 Revert to commit ${argv.commitId} completed!`);
      console.log(`💾 Backup available at: ${backupPath}`);
    });
  } catch (err) {
    console.error("❌ Revert failed:", err.message);
    process.exit(1);
  }
}

// Helper to list files recursively (excludes specified directories/files)
async function listFiles(dir, exclude = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(fullPath, exclude);
      files.push(...nested);
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

module.exports = { revertRepo };