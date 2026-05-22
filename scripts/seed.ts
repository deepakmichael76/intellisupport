import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { Intent } from "../src/models/Intent";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/customer-support-chatbot";

const intents = [
  {
    intentName: "greet",
    examples: ["hello", "hi there", "good morning", "hey"],
    responses: [
      "Hello! Welcome to our support. How can I help you today?",
      "Hi! I'm your AI assistant. What can I do for you?",
    ],
  },
  {
    intentName: "order_status",
    examples: [
      "track my order",
      "where is my package",
      "order status",
      "shipping update",
      "when will my order arrive",
    ],
    responses: [
      "I can help track your order. Please share your order number from your confirmation email.",
      "Your package is typically delivered within 3-5 business days. Share your order ID for specific tracking.",
    ],
  },
  {
    intentName: "refund",
    examples: ["I want a refund", "return my product", "money back", "cancel and refund"],
    responses: [
      "Refunds are processed within 5-7 business days after we receive the returned item.",
      "I can help start a refund. Was the product damaged or would you like to return it?",
    ],
  },
  {
    intentName: "complaint",
    examples: ["I have a complaint", "terrible service", "product is broken", "very disappointed"],
    responses: [
      "I'm sorry to hear that. Please describe the issue and I'll escalate if needed.",
      "Your feedback matters. Tell me more so we can resolve this quickly.",
    ],
  },
  {
    intentName: "pricing",
    examples: ["how much does it cost", "pricing plans", "what are your prices", "subscription cost"],
    responses: [
      "We offer flexible plans starting at $9/month. Visit our pricing page for full details.",
      "Pricing depends on the product. Which item are you interested in?",
    ],
  },
  {
    intentName: "support",
    examples: ["I need help", "talk to support", "customer service", "assist me"],
    responses: [
      "I'm here to help! Describe your issue and I'll assist or connect you with an agent.",
      "Sure! What do you need help with today?",
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  await User.findOneAndUpdate(
    { email: "admin@supportai.com" },
    {
      name: "Admin User",
      email: "admin@supportai.com",
      password: adminPassword,
      role: "admin",
    },
    { upsert: true }
  );

  const agentPassword = await bcrypt.hash("Agent123!", 12);
  await User.findOneAndUpdate(
    { email: "agent@supportai.com" },
    {
      name: "Support Agent",
      email: "agent@supportai.com",
      password: agentPassword,
      role: "support-agent",
    },
    { upsert: true }
  );

  for (const intent of intents) {
    await Intent.findOneAndUpdate({ intentName: intent.intentName }, intent, {
      upsert: true,
    });
  }

  console.log("Seed complete!");
  console.log("Admin: admin@supportai.com / Admin123!");
  console.log("Agent: agent@supportai.com / Agent123!");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
