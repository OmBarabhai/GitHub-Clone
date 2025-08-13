// hashPasswords.js (separate file in your backend root)
const { supabaseAdmin } = require("./supabaseClient");
const bcrypt = require("bcrypt");

async function hashAllPasswords() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, password");
    
    if (error) throw error;

    for (const user of users) {
      if (!user.password) {
        console.log(`Skipping user ${user.email} (missing password)`);
        continue;
      }

      if (user.password.startsWith('$2b$10$')) {
        console.log(`Skipping ${user.email} (already hashed)`);
        continue;
      }

      console.log(`Hashing password for user: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ password: hashedPassword })
        .eq("id", user.id);
      
      if (updateError) {
        console.error(`Update failed for ${user.email}:`, updateError.message);
      } else {
        console.log(`Updated password for ${user.email} (ID:${user.id})`);
      }
    }
  } catch (err) {
    console.error("Error hashing passwords:", err);
  }
}

hashAllPasswords();