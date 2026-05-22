"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAuthStore } from "@/store/auth-store";
import { useSocket } from "@/hooks/use-socket";
import type { ChatMessage } from "@/types";

interface EscalatedChat {
  _id: string;
  title: string;
  userId: { name: string; email: string };
  messages: ChatMessage[];
  escalatedAt?: string;
}

export default function LiveChatPage() {
  const { accessToken } = useAuthStore();
  const { socket, connected } = useSocket();
  const [chats, setChats] = useState<EscalatedChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    fetch("/api/admin/conversations", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setChats(d.conversations || []))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;

    socket.on("active_chats", (data: EscalatedChat[]) => {
      setChats(data);
    });

    socket.on("new_message", (data: { conversationId: string; message: ChatMessage }) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return () => {
      socket.off("active_chats");
      socket.off("new_message");
    };
  }, [socket, activeId]);

  const joinChat = async (chat: EscalatedChat) => {
    setActiveId(chat._id);
    setMessages(
      chat.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
    );
    socket?.emit("join_conversation", chat._id);
  };

  const sendMessage = (content: string) => {
    if (!activeId || !socket) return;
    socket.emit("send_message", { conversationId: activeId, content });
    setMessages((prev) => [
      ...prev,
      { sender: "agent", content, timestamp: new Date() },
    ]);
  };

  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-4">
        <Card className="w-80 shrink-0">
          <CardHeader>
            <CardTitle className="text-base">
              Active Chats {connected && <span className="text-emerald-500 text-xs">●</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            <Link href="/admin" className="block mb-2">
              <Button variant="ghost" size="sm" className="w-full">
                ← Dashboard
              </Button>
            </Link>
            {chats.length === 0 && (
              <p className="text-sm text-zinc-500">No escalated chats</p>
            )}
            {chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => joinChat(chat)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === chat._id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <p className="font-medium text-sm truncate">{chat.title}</p>
                <p className="text-xs text-zinc-500">
                  {typeof chat.userId === "object" ? chat.userId.name : "Customer"}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col">
          {activeId ? (
            <>
              <CardContent className="flex-1 overflow-y-auto pt-6">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
              </CardContent>
              <ChatInput onSend={sendMessage} />
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96 text-zinc-500">
              Select a chat to start helping a customer
            </CardContent>
          )}
        </Card>
      </main>
    </section>
  );
}
