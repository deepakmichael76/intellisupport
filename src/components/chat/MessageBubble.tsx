"use client";

import { motion } from "framer-motion";
import { Bot, User, Headphones } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTimestamp, cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
}

export function MessageBubble({ message, userName = "You" }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const isAgent = message.sender === "agent";
  const Icon = isUser ? User : isAgent ? Headphones : Bot;
  const label = isUser ? userName : isAgent ? "Agent" : "AI Assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 mb-4", isUser && "flex-row-reverse")}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback
          className={cn(
            isUser && "bg-blue-100 text-blue-700",
            isAgent && "bg-emerald-100 text-emerald-700"
          )}
        >
          <Icon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <section className={cn("flex flex-col max-w-[75%]", isUser && "items-end")}>
        <span className="text-xs text-zinc-500 mb-1">{label}</span>
        <section
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-violet-600 text-white rounded-br-sm"
              : isAgent
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 rounded-bl-sm"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm"
          )}
        >
          {message.content}
        </section>
        <section className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-zinc-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.intent && (
            <span className="text-[10px] text-zinc-400">
              · {message.intent}
              {message.confidenceScore != null &&
                ` (${Math.round(message.confidenceScore * 100)}%)`}
            </span>
          )}
        </section>
      </section>
    </motion.div>
  );
}

