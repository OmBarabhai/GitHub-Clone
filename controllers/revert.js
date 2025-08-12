const fs = require("fs").promises;
const path = require("path");

async function revertRepo({ commitId }) {
  try {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const commitsPath = path.join(repoPath, "commits");
    const commitPath = path.join(commitsPath, commitId);

    // 1. Check if local repo exists
    try {
      await fs.access(repoPath);
    } catch {
      console.error("❌ No repository found. Run 'init' first.");
      return;
    }

    // 2. Check if commit exists
    try {
      await fs.access(commitPath);
    } catch {
      console.error(`❌ Commit ${commitId} not found.`);
      return;
    }

    // 3. Show commit message
    try {
      const messagePath = path.join(commitPath, "message.txt");
      const message = await fs.readFile(messagePath, "utf-8");
      console.log(`📜 Commit message: ${message.trim()}`);
    } catch {
      console.log("⚠ No commit message found.");
    }

    // 4. Remove all files/folders in current directory except .apnaGit
    async function clearWorkingDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".apnaGit") continue;
        const entryPath = path.join(dir, entry.name);
        await fs.rm(entryPath, { recursive: true, force: true });
      }
    }
    await clearWorkingDirectory(process.cwd());

    // 5. Recursively restore all files from that commit

async function restoreDir(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await restoreDir(srcPath, destPath);
    } else if (entry.isFile() && entry.name !== "message.txt") {
      // Read as raw buffer, not UTF-8 string
      const buffer = await fs.readFile(srcPath);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, buffer);
    }
  }
}


    await restoreDir(commitPath, process.cwd());

    console.log(`⏪ Successfully reverted to commit ${commitId}`);
 } catch (err) {
    console.error("❌ Error reverting to commit:", err.message);
  }
}

module.exports = { revertRepo };
