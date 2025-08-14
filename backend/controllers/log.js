// controllers/log.js

const { supabase } = require("../config/supabaseClient");

// ✅ Get commit logs
const getCommitLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Display commit logs in console
    console.log("📜 Commit Logs:");
    console.table(data); // Node.js built-in

    res.json({
      message: "Commit logs fetched successfully",
      data,
    });
  } catch (err) {
    console.error("Error fetching commit logs:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCommitLogs,
};
