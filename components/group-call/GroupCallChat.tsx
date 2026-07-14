"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { FiX, FiSend } from "react-icons/fi";
import { getLiveKitRoom, sendChatMessage, type LiveKitChatMessage } from "@/lib/livekit";

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  timestamp: number;
  isOwn: boolean;
}

export default function GroupCallChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for incoming data channel messages via custom event
  useEffect(() => {
    const handleDataReceived = (e: Event) => {
      const { payload, participantIdentity, topic } = (e as CustomEvent).detail;
      // Only process chat topic messages
      if (topic && topic !== "chat") return;

      try {
        const decoded = new TextDecoder().decode(payload);
        const data: LiveKitChatMessage = JSON.parse(decoded);

        const room = getLiveKitRoom();
        const isOwn = room
          ? data.sender === room.localParticipant.identity
          : false;

        const msg: ChatMessage = {
          id: `${data.sender}-${data.timestamp}`,
          text: data.message,
          sender: data.sender,
          senderName: data.senderName,
          timestamp: data.timestamp,
          isOwn,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch {}
    };

    window.addEventListener("livekit:data-received", handleDataReceived);
    return () => {
      window.removeEventListener("livekit:data-received", handleDataReceived);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;

    const room = getLiveKitRoom();
    if (!room) return;

    sendChatMessage(draft.trim());

    // Use LiveKit identity as sender to match echoed-back messages
    const localIdentity = room.localParticipant.identity;
    const localName = room.localParticipant.name || "You";

    const msg: ChatMessage = {
      id: `${localIdentity}-${Date.now()}`,
      text: draft.trim(),
      sender: localIdentity,
      senderName: localName,
      timestamp: Date.now(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, msg]);
    setDraft("");
  }, [draft]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col bg-zinc-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3">
        <h3 className="text-sm font-bold text-white">In-call chat</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="scrollbar-group flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-zinc-500">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {msg.isOwn ? "You" : msg.senderName}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`mt-0.5 max-w-[85%] rounded-xl px-3 py-2 text-xs leading-5 ${
                    msg.isOwn
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-indigo-500"
          />
          <motion.button
            onClick={handleSend}
            disabled={!draft.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40"
          >
            <FiSend className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
