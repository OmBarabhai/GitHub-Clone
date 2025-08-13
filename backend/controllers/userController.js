// userController.js
const bcrypt = require("bcrypt");
const { supabase, supabaseAdmin } = require("../supabaseClient"); // SINGLE IMPORT AT TOP

// ✅ Get all users (without passwords)
const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;

    // Remove passwords from response
    const users = data.map(({ password, ...rest }) => rest);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Signup with hashed password and duplicate check
const signup = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;

    // Check if email or username already exists
    const { data: existingUsers, error: existingError } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${username}`);

    if (existingError) throw existingError;

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with hashed password
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          first_name,
          last_name,
        },
      ])
      .select();

    if (error) throw error;

    // Remove password from response
    const userWithoutPassword = data.map(({ password, ...rest }) => rest);

    res.status(201).json({
      message: "User created successfully",
      data: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.trim()); // Add trim to avoid whitespace issues

    if (error) {
      console.log("Database error:", error.message);
      return res.status(500).json({ error: "Database error" });
    }

    // Handle no user found
    if (!users || users.length === 0) {
      console.log("User not found for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    console.log(`User found: ${user.email} (ID:${user.id})`);

    // ... rest of login logic remains the same ...
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// In getUserProfile, updateUserProfile, deleteUserProfile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert id to number and validate
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId);  // Use the numeric ID

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data[0];
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error("Unexpected error in getUserProfile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Update user profile by ID (do not allow password update here)
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...updates } = req.body; // exclude password updates here

    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    // Check if we got any data back
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the first (and only) updated user
    const updatedUser = data[0];
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "User profile updated successfully",
      data: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete user profile by ID
// ✅ Delete user profile by ID
const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify the user exists
    const { data: existingUsers, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", id);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({ error: "Database error" });
    }

    if (!existingUsers || existingUsers.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Now delete the user
    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return res.status(500).json({ error: "Failed to delete user" });
    }

    res.json({ message: "User profile deleted successfully" });
  } catch (err) {
    console.error("Full delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
