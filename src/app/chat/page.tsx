"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "@/components/layout/Navbar";

export default function ChatPage() {
  return (
    <section className="flex flex-col h-screen">
      <Navbar />
      <section className="flex-1 overflow-hidden">
        <ChatWindow />
      </section>
    </section>
  );
}
