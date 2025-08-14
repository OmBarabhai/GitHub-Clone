const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://rpcjeicrvbxitkfpjrll.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjAwMDQsImV4cCI6MjA3MDQ5NjAwNH0.BrzB3MPdDb7z2Xwo-lDRjp9YbflD8haD-SIM2xYiiVk";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2plaWNydmJ4aXRrZnBqcmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkyMDAwNCwiZXhwIjoyMDcwNDk2MDA0fQ.Uqh6CF3ioJvYNgaRuBHIa0UkJaZH9D0w64aRqaRMD64";

// Create clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

console.log("🔌 Supabase clients initialized");

module.exports = { 
  supabase, 
  supabaseAdmin 
};