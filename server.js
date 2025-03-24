import http from "http";
import app from "./app.js";
import connect from "./db/db.js";
import "dotenv/config";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

connect();

const port = process.env.PORT || 8080;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Track active users and their code changes
const activeUsers = new Map(); // Map<projectId, Set<userId>>
const codeChanges = new Map(); // Map<fileId, content>

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    socket.project = await projectModel.findById(projectId);

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;
    socket.projectId = projectId; // Attach projectId to the socket
    socket.userId = decoded._id; // Attach userId to the socket

    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  const { projectId, userId } = socket;

  console.log(`User ${userId} connected to project ${projectId}`);

  // Join the project room
  socket.join(projectId);

  // Add user to active users
  if (!activeUsers.has(projectId)) {
    activeUsers.set(projectId, new Set());
  }
  activeUsers.get(projectId).add(userId);
  io.to(projectId).emit("active-users", Array.from(activeUsers.get(projectId)));

  // Handle project messages
  socket.on("project-message", async (data) => {
    const message = data.message;

    const aiIsPresentInMessage = message.includes("@ai");
    socket.broadcast.to(projectId).emit("project-message", data);

    if (aiIsPresentInMessage) {
      const prompt = message.replace("@ai", "");

      const result = await generateResult(prompt);

      io.to(projectId).emit("project-message", {
        message: result,
        sender: {
          _id: "ai",
          email: "AI",
        },
      });

      return;
    }
  });

  // Handle code changes
  socket.on("code-change", (data) => {
    const { fileId, content } = data;

    codeChanges.set(fileId, content);

    // Broadcast the change to all users in the project (except the sender)
    socket.broadcast
      .to(projectId)
      .emit("code-change", { fileId, content, userId });
    console.log(`User ${userId} updated file ${fileId}`);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected from project ${projectId}`);

    // Remove user from active users
    if (activeUsers.has(projectId)) {
      activeUsers.get(projectId).delete(userId);
      io.to(projectId).emit(
        "active-users",
        Array.from(activeUsers.get(projectId))
      );
    }

    // Leave the project room
    socket.leave(projectId);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
