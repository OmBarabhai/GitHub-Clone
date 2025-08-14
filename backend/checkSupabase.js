const { supabase } = require("./config/supabaseClient"); // adjust path if needed

async function checkTables() {
  try {
    // 1. List staged_files table content
    const { data, error } = await supabase.from("staged_files").select("*");

    if (error) throw error;

    console.log("📋 staged_files table content:");
    console.table(data);
  } catch (err) {
    console.error("❌ Error fetching data:", err.message);
  }
}

checkTables();
