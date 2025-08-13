// Load .env file
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require("express");
const cors = require("cors"); // Fixed typo: "core" -> "cors"
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router"); // Correct path

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// Import controllers
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");
const { logRepo } = require("./controllers/log");
const userController = require("./controllers/userController");

// Import Supabase client
const { supabase } = require("./supabaseClient");

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/", mainRouter);

// Commit history endpoint (outside startServer)
app.get("/commits", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("message", (msg) => {
    console.log("📩 Received message:", msg);
    io.emit("message", msg);
  });

  socket.on("joinRoom", (userID) => {
    console.log(`User joining room: ${userID}`);
    socket.join(userID);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server function
function startServer() {
  const PORT = process.env.PORT || 5000;
  const supabaseUrl = process.env.SUPABASE_URL;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (supabaseUrl) {
      console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    } else {
      console.error("❌ SUPABASE_URL environment variable is not set!");
    }
  });
}

// CLI setup
yargs(hideBin(process.argv))
  .command("start", "Start a new server", {}, startServer)
  .command("init", "Initialise a new repository", {}, initRepo)
  .command("add <file>", "Add a file to the repository", (yargs) => {
    yargs.positional("file", {
      describe: "File to add to the staging area",
      type: "string",
    });
  }, addRepo)
  .command("commit <message>", "Commit staged changes", (yargs) => {
    yargs.positional("message", {
      describe: "Commit message",
      type: "string",
    });
  }, commitRepo)
  .command("push", "Push changes to remote repository", {}, pushRepo)
  .command("pull", "Pull latest changes from remote repository", {}, pullRepo)
  .command("revert <commitId>", "Revert to a specific commit", (yargs) => {
    yargs.positional("commitId", {
      describe: "ID of commit to revert",
      type: "string",
    });
  }, revertRepo)
  .command("log", "Show commit history", {}, logRepo)
  .command("fetch-users", "Get all users from Supabase", {}, async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) console.error("Error fetching users:", error.message);
    else console.table(data);
  })
  .command("add-user <first> <last> <email>", "Add a user to Supabase", (yargs) => {
    yargs
      .positional("first", { describe: "First name", type: "string" })
      .positional("last", { describe: "Last name", type: "string" })
      .positional("email", { describe: "Email address", type: "string" });
  }, async (argv) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ first_name: argv.first, last_name: argv.last, email: argv.email }])
      .select();
    if (error) console.error("Error adding user:", error.message);
    else console.log("✅ User added successfully:", data);
  })
  .demandCommand(1, "You need at least one command")
  .help()
  .parse();
