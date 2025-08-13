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
    console.log("Login attempt for email:", email);

    // Use admin client for login to bypass RLS
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.log("User not found:", error.message);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`User found: ${user.email} (ID:${user.id})`);
    console.log(`Password type: ${typeof user.password}, Length: ${user.password?.length}`);
    console.log(`Password prefix: ${user.password?.substring(0, 10)}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid?", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      data: userWithoutPassword,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};
// ✅ Get user profile by ID (without password)
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Remove password
    const { password, ...userWithoutPassword } = data;

    res.json(userWithoutPassword);
} catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update user profile by ID (do not allow password update here)
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...updates } = req.body; // exclude password updates here

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    // Remove password
    const userWithoutPassword = data.map(({ password, ...rest }) => rest);

    res.json({
      message: "User profile updated successfully",
      data: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete user profile by ID
const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "User profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
