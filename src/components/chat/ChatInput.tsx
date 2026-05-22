"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Paperclip, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((m) => m.default),
  { ssr: false }
);

interface ChatInputProps {
  onSend: (message: string, attachments?: string[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed || "Sent an attachment", attachments);
    setMessage("");
    setAttachments([]);
    setShowEmoji(false);
    onTyping?.(false);
  };

  const handleChange = (value: string) => {
    setMessage(value);
    onTyping?.(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1500);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("accessToken");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (data.url) setAttachments((prev) => [...prev, data.url]);
  };

  return (
    <section className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      {showEmoji && (
        <section className="mb-2">
          <EmojiPicker onEmojiClick={(e) => setMessage((m) => m + e.emoji)} />
        </section>
      )}
      {attachments.length > 0 && (
        <section className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((url) => (
            <span key={url} className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded">
              {url.split("/").pop()}
            </span>
          ))}
        </section>
      )}
      <section className="flex gap-2 items-end">
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={disabled}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} disabled={disabled}>
          <Smile className="h-4 w-4" />
        </Button>
        <Input
          value={message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={disabled || (!message.trim() && attachments.length === 0)}>
          <Send className="h-4 w-4" />
        </Button>
      </section>
    </section>
  );
}
