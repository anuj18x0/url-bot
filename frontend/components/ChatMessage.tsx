"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  BarChart3Icon,
  BotIcon,
  UserIcon,
} from "lucide-react";
import type { ChatMessage as ChatMessageType, AnalyticsData } from "@/lib/api";

// --- Mini bar chart for analytics (no heavy lib needed for this) ---
function MiniBarChart({ data }: { data: { date: string; clicks: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="mt-3 flex items-end gap-1.5" style={{ height: 64 }}>
      {data.map((d, i) => {
        const height = Math.max((d.clicks / maxClicks) * 56, 3);
        const label = new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="flex w-8 flex-col items-center gap-1"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  style={{ originY: 1 }}
                >
                  <span className="text-[9px] text-muted-foreground">
                    {d.clicks}
                  </span>
                  <div
                    className="w-full rounded-sm bg-foreground/80"
                    style={{ height }}
                  />
                  <span className="text-[8px] text-muted-foreground/60">
                    {label}
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                {d.clicks} clicks on {label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// --- Analytics card ---
function AnalyticsCard({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <BarChart3Icon className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium">Link Analytics</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {analytics.bitlink}
        </Badge>
      </div>
      <Separator className="my-2" />
      <div className="flex items-baseline gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">
            {analytics.total_clicks.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">total clicks</span>
        </div>
        {analytics.unique_visitors !== undefined && (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold tabular-nums text-muted-foreground">
              {analytics.unique_visitors.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground/70">unique</span>
          </div>
        )}
      </div>
      {analytics.clicks_by_day && analytics.clicks_by_day.length > 0 && (
        <MiniBarChart data={analytics.clicks_by_day} />
      )}
      <p className="mt-2 text-[10px] text-muted-foreground/70">
        {analytics.period}
      </p>
    </div>
  );
}

// --- Link + QR card ---
function LinkCard({
  shortUrl,
  qrBase64,
}: {
  shortUrl: string;
  qrBase64?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {shortUrl}
          </a>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <ExternalLinkIcon className="size-3.5 text-muted-foreground transition-colors hover:text-foreground" />
          </a>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckIcon className="size-3 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? "Copied!" : "Copy link"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {qrBase64 && (
        <div className="mt-3 flex justify-center">
          <img
            src={`data:image/png;base64,${qrBase64}`}
            alt="QR Code"
            className="size-28 rounded-md border border-border/30 bg-white p-1"
          />
        </div>
      )}
    </div>
  );
}

// --- Main ChatMessage component ---
interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Avatar */}
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <BotIcon className="size-3.5" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted/60 text-foreground"
        }`}
      >
        {/* Text content */}
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
          {message.content}
        </p>

        {/* Short URL + QR */}
        {message.short_url && (
          <LinkCard
            shortUrl={message.short_url}
            qrBase64={message.qr_code_base64}
          />
        )}

        {/* Analytics */}
        {message.analytics && <AnalyticsCard analytics={message.analytics} />}

        {/* Timestamp */}
        <p
          className={`mt-1.5 text-[10px] ${
            isUser
              ? "text-primary-foreground/50"
              : "text-muted-foreground/50"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}

// --- Typing indicator ---
export function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <BotIcon className="size-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-muted/60 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block size-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
