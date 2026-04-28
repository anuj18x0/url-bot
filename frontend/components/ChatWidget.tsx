"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage as ChatMessageType } from "@/lib/api";

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatWidget({ isOpen, onToggle }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    // Add user message
    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, sessionId);

      // Store session ID for continuity
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Add assistant message
      const botMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        short_url: response.short_url,
        long_url: response.long_url,
        qr_code_base64: response.qr_code_base64,
        analytics: response.analytics,
        tracking: response.tracking,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);

      const errorMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <Button
              size="icon-lg"
              className="relative size-14 rounded-full shadow-lg"
              onClick={onToggle}
            >
              <MessageCircleIcon className="size-6" />
              {/* Pulse ring */}
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col overflow-hidden border-l border-t border-border/60 bg-background shadow-2xl sm:bottom-6 sm:right-6 sm:h-[620px] sm:w-[420px] sm:rounded-2xl sm:border"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <SparklesIcon className="size-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">LinkBot</h3>
                <p className="text-[11px] text-muted-foreground">
                  AI URL Agent • Powered by Gemini
                </p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={clearChat}
                    title="Clear chat"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggle}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <AnimatePresence>
                    {isLoading && <TypingIndicator />}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t px-4 py-3">
              {error && (
                <p className="mb-2 text-[11px] text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything or paste a URL..."
                  disabled={isLoading}
                  className="flex-1 text-[13px]"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <SendIcon className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
                Try: &quot;shorten https://github.com&quot; or &quot;what is URL shortening?&quot;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Empty state ---
function EmptyState() {
  const suggestions = [
    "Shorten https://github.com",
    "What is URL shortening?",
    "How does Bitly work?",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <SparklesIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h4 className="text-sm font-medium">How can I help?</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Shorten URLs, get analytics, or just ask a question.
        </p>
      </div>
      <Separator className="my-1 w-16" />
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <Badge
            key={s}
            variant="outline"
            className="cursor-default text-[11px]"
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}
