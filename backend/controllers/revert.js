const fs = require("fs").promises;
const path = require("path");

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

    // 2. Gather commit files
    const commitFiles = [];

    async function listFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await listFiles(fullPath);
        } else if (entry.isFile() && entry.name !== "message.txt") {
          const relativePath = path.relative(commitPath, fullPath);
          commitFiles.push(relativePath);
        }
      }
    }

    await listFiles(commitPath);

    // 3. Preview files to restore
    console.log(`⚠️ The following files will be restored from commit ${argv.commitId}:`);
    commitFiles.forEach(file => console.log(`  ↩️ ${file}`));

    // 4. Ask for confirmation
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question("Do you want to proceed? (yes/no) ", async (answer) => {
      readline.close();
      if (answer.toLowerCase() !== "yes") {
        console.log("❌ Revert cancelled by user.");
        process.exit(0);
      }

      // 5. Restore files safely
      for (const file of commitFiles) {
        const src = path.join(commitPath, file);
        const dest = path.join(process.cwd(), file);

        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
        console.log(`✅ Restored: ${file}`);
      }

      console.log(`🎉 Revert to commit ${argv.commitId} completed safely!`);
    });
  } catch (err) {
    console.error("❌ Revert failed:", err.message);
    process.exit(1);
  }
}

module.exports = { revertRepo };
