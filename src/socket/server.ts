import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { verifyAccessToken } from "../lib/auth";
import { Conversation } from "../models/Conversation";
import { User } from "../models/User";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/customer-support-chatbot";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

interface AgentRoom {
  conversationId: string;
  agentId: string;
  userId: string;
}

const activeChats = new Map<string, AgentRoom>();

async function start() {
  await mongoose.connect(MONGODB_URI);

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN.split(","),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Authentication required"));
    const user = verifyAccessToken(token);
    if (!user) return next(new Error("Invalid token"));
    socket.data.user = user;
    next();
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as {
      userId: string;
      email: string;
      role: string;
    };

    await User.findByIdAndUpdate(user.userId, { isOnline: true });
    socket.join(`user:${user.userId}`);

    if (user.role === "support-agent" || user.role === "admin") {
      socket.join("agents");
      const escalated = await Conversation.find({ status: "escalated" })
        .populate("userId", "name email")
        .sort({ escalatedAt: -1 })
        .limit(50)
        .lean();
      socket.emit("active_chats", escalated);
    }

    socket.on("join_conversation", async (conversationId: string) => {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const isOwner = conversation.userId.toString() === user.userId;
      const isAgent = user.role === "support-agent" || user.role === "admin";

      if (!isOwner && !isAgent) return;

      socket.join(`conversation:${conversationId}`);

      if (isAgent && conversation.status === "escalated") {
        conversation.assignedAgentId = new mongoose.Types.ObjectId(user.userId);
        await conversation.save();
        activeChats.set(conversationId, {
          conversationId,
          agentId: user.userId,
          userId: conversation.userId.toString(),
        });
        io.to(`user:${conversation.userId}`).emit("agent_joined", {
          conversationId,
          agentName: (await User.findById(user.userId))?.name,
        });
      }
    });

    socket.on(
      "send_message",
      async (data: { conversationId: string; content: string }) => {
        const conversation = await Conversation.findById(data.conversationId);
        if (!conversation) return;

        const sender =
          user.role === "support-agent" || user.role === "admin" ? "agent" : "user";

        conversation.messages.push({
          sender,
          content: data.content,
          timestamp: new Date(),
        });
        await conversation.save();

        io.to(`conversation:${data.conversationId}`).emit("new_message", {
          conversationId: data.conversationId,
          message: conversation.messages[conversation.messages.length - 1],
        });
      }
    );

    socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing", {
        conversationId: data.conversationId,
        userId: user.userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(user.userId, { isOnline: false });
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
}

start().catch(console.error);
