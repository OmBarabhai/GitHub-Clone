const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// Import routers
const mainRouter = require("./routes/main.router");

// Import controllers
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");
const { getCommitLogs } = require("./controllers/log");
const { supabase } = require("./config/supabaseClient");

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", mainRouter);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
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

// API endpoint to fetch commit logs
app.get("/api/logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commits")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    console.table(data);
    res.json({ message: "Commit logs fetched successfully", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server function
function startServer() {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// CLI commands
yargs(hideBin(process.argv))
  .command("start", "Start the server", {}, startServer)
  .command("init", "Initialize a new repository", {}, initRepo)
  .command(
    "add <file>",
    "Add a file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add to staging",
        type: "string",
      });
    },
    addRepo
  )
  .command(
    "commit <message>",
    "Commit staged changes",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    commitRepo
  )
  .command("push", "Push changes to remote repository", {}, pushRepo)
  .command("pull", "Pull latest changes from remote repository", {}, pullRepo)
  .command(
    "revert <commitId>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitId", {
        describe: "ID of commit to revert",
        type: "string",
      });
    },
    revertRepo
  )
  .command("log", "Show commit history", {}, async () => {
    try {
      const { data, error } = await supabase
        .from("commits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      console.log("📜 Commit Logs:");
      console.table(data);
    } catch (err) {
      console.error("Error fetching commit logs:", err.message);
    }
  })
  .demandCommand(1, "You need at least one command")
  .help()
  .parse();
