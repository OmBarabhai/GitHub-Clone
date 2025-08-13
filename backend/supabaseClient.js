// // supabaseClient.js
// const { createClient } = require("@supabase/supabase-js");
// require('dotenv').config(); // ADD THIS LINE

// const supabaseUrl = "https://rpcjeicrvbxitkfpjrll.supabase.co";
// const supabaseAnonKey  =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjAwMDQsImV4cCI6MjA3MDQ5NjAwNH0.BrzB3MPdDb7z2Xwo-lDRjp9YbflD8haD-SIM2xYiiVk";

// // 🔥 FIXED: Added quotes around the service role key
// const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkyMDAwNCwiZXhwIjoyMDcwNDk2MDA0fQ.Uqh6CF3ioJvYNgaRuBHIa0UkJaZH9D0w64aRqaRMD64";

// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error(
//     "❌ Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file"
//   );
// }

// console.log("🔗 Connecting to Supabase:", supabaseUrl);

// // Create two clients:
// const supabase = createClient(supabaseUrl, supabaseAnonKey);
// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// module.exports = { supabase, supabaseAdmin };

const { createClient } = require("@supabase/supabase-js");
require('dotenv').config();

// Use environment variables instead of hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || "https://rpcjeicrvbxitkfpjrll.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjAwMDQsImV4cCI6MjA3MDQ5NjAwNH0.BrzB3MPdDb7z2Xwo-lDRjp9YbflD8haD-SIM2xYiiVk";

// 🔥 CRITICAL FIX: Service role key was malformed
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkyMDAwNCwiZXhwIjoyMDcwNDk2MDA0fQ.Uqh6CF3ioJvYNgaRuBHIa0UkJaZH9D0w64aRqaRMD64";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "❌ Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file"
  );
}

console.log("🔗 Connecting to Supabase:", supabaseUrl);

// Create admin client with proper configuration
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Regular client for non-admin operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAdmin };