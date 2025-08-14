const { supabase } = require("./config/supabaseClient"); // adjust path if needed

async function checkTables() {
  // Check repositories
  let { data: repos, error: repoErr } = await supabase.from("repositories").select("*");
  if (repoErr) console.error("Repositories error:", repoErr);
  else console.table(repos);

  // Check commits
  let { data: commits, error: commitErr } = await supabase.from("commits").select("*");
  if (commitErr) console.error("Commits error:", commitErr);
  else console.table(commits);

  // Check staged_files
  let { data: staged, error: stagedErr } = await supabase.from("staged_files").select("*");
  if (stagedErr) console.error("Staged files error:", stagedErr);
  else console.table(staged);

  // Check commit_files
  let { data: commitFiles, error: cfErr } = await supabase.from("commit_files").select("*");
  if (cfErr) console.error("Commit files error:", cfErr);
  else console.table(commitFiles);
}

checkTables();
