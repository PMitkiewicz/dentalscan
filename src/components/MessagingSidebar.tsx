"use client";

import React, { useEffect, useState } from "react";

type Message = {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
};

export default function MessagingSidebar({
  patientId,
}: {
  patientId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // fetch messages
  useEffect(() => {
    async function loadMessages() {
      const res = await fetch(
        `/api/messaging?patientId=${patientId}`
      );
      const data = await res.json();
      setMessages(data.messages || []);
    }

    loadMessages();
  }, [patientId]);

  // send message (optimistic UI)
  const sendMessage = async () => {
    if (!input.trim()) return;

    const tempMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      sender: "patient",
      createdAt: new Date().toISOString(),
    };

    // optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/messaging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          content: tempMessage.content,
          sender: "patient",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // replace temp message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? data.message : m
        )
      );
    } catch (err) {
      console.error("Message failed:", err);

      // rollback on failure
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempMessage.id)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-semibold">Messages</h2>
        <p className="text-xs text-zinc-500">
          Patient chat with clinic
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded text-sm max-w-[85%] ${
              msg.sender === "patient"
                ? "bg-blue-600 ml-auto"
                : "bg-zinc-800"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
                sendMessage();}
            }}
          placeholder="Type a message..."
          className="flex-1 p-2 bg-zinc-900 rounded text-sm outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}