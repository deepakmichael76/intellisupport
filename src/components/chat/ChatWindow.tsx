"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Moon, Sun, Volume2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useSocket } from "@/hooks/use-socket";
import { useTheme } from "@/hooks/use-theme";
import { getApiErrorMessage } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export function ChatWindow() {
  const { user, accessToken } = useAuthStore();
  const { socket, connected } = useSocket();
  const { dark, toggle } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const notifySound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notifySound.current = new Audio("/notification.mp3");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping, agentTyping]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", conversationId);

    const onMessage = (data: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, data.message]);
      notifySound.current?.play().catch(() => {});
    };

    const onTyping = (data: { isTyping: boolean }) => {
      setAgentTyping(data.isTyping);
    };

    socket.on("new_message", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.off("new_message", onMessage);
      socket.off("typing", onTyping);
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      const userMsg: ChatMessage = {
        sender: "user",
        content,
        timestamp: new Date(),
        attachments,
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setBotTyping(true);

      try {
        if (conversationId && socket && connected) {
          socket.emit("send_message", { conversationId, content });
          setBotTyping(false);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            message: content,
            ...(conversationId ? { conversationId } : {}),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(getApiErrorMessage(data.error, "Failed to send message"));
        }

        setConversationId(data.conversationId);
        setMessages(
          data.messages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );

        if (data.escalated) {
          await fetch("/api/live-agent/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ conversationId: data.conversationId }),
          });
          socket?.emit("join_conversation", data.conversationId);
        }

        notifySound.current?.play().catch(() => {});
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            sender: "system",
            content: message,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
        setBotTyping(false);
      }
    },
    [accessToken, conversationId, socket, connected]
  );

  const filtered = search
    ? messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()))
    : messages;

  const exportChat = () => {
    if (!conversationId) return;
    window.open(`/api/export?conversationId=${conversationId}`, "_blank");
  };

  return (
    <section className="flex flex-col h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-semibold text-lg"
        >
          Support Chat
          {connected && (
            <span className="ml-2 text-xs text-emerald-500 font-normal">● Live</span>
          )}
        </motion.h1>
        <section className="flex items-center gap-2">
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40 h-8 text-xs hidden sm:block"
          />
          <Button variant="ghost" size="icon" onClick={exportChat} title="Export chat">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => notifySound.current?.play().catch(() => {})} title="Test sound">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </section>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-6">
        {filtered.length === 0 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-zinc-500 mt-20"
          >
            <p className="text-lg font-medium">How can we help you today?</p>
            <p className="text-sm mt-2">Ask about orders, refunds, pricing, or get live support.</p>
          </motion.section>
        )}
        {filtered.map((msg, i) => (
          <MessageBubble key={i} message={msg} userName={user?.name} />
        ))}
        {botTyping && <TypingIndicator />}
        {agentTyping && <TypingIndicator />}
        <section ref={bottomRef} />
      </section>

      <ChatInput
        onSend={sendMessage}
        onTyping={(isTyping) => {
          if (conversationId && socket) {
            socket.emit("typing", { conversationId, isTyping });
          }
        }}
        disabled={loading}
      />
    </section>
  );
}
