const { supabase } = require("./config/supabaseClient"); // adjust path if needed
const { Buffer } = require("buffer"); // Node.js buffer module

async function queryFile(repoId, fileName) {
  const { data, error } = await supabase
    .from("staged_files")
    .select("*")
    .eq("repo_id", repoId)
    .eq("file_name", fileName);

  if (error) {
    console.error("Error fetching file:", error);
    return;
  }

  if (data.length === 0) {
    console.log("No file found with that name in this repo.");
    return;
  }

  // Show raw data
  console.table(data);

  // Decode base64 content if it exists
  data.forEach(file => {
  if (file.content_base64) {
    const decoded = Buffer.from(file.content_base64, "base64").toString("utf16le");
    console.log(`\nDecoded content of ${file.file_name}:\n`, decoded);
  }
});
}

// Replace with your repo_id and file_name
const repoId = "5cacf3b4-d11a-4f44-aff1-3a75d027ebb4";
const fileName = "test.txt";

queryFile(repoId, fileName);
