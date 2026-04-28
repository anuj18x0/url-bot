"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, SparklesIcon, ZapIcon } from "lucide-react";

interface HeroSectionProps {
  onOpenChat: () => void;
}

export function HeroSection({ onOpenChat }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.25 270) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 right-0 h-[450px] w-[450px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.2 330) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-[350px] w-[350px] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 200) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1">
            <SparklesIcon className="size-3" />
            AI-Powered URL Shortening
          </Badge>
        </motion.div>

        <motion.h1
          className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          Shorten{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.65 0.25 270), oklch(0.7 0.22 310), oklch(0.72 0.2 350))",
            }}
          >
            Smarter
          </span>{" "}
          with AI
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        >
          An intelligent agent that creates Bitly short links, tracks analytics,
          and answers your questions — all through natural conversation.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <Button
            size="lg"
            className="gap-2 px-6 text-sm"
            onClick={onOpenChat}
          >
            <ZapIcon className="size-4" />
            Start Chatting
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 px-6 text-sm"
            onClick={onOpenChat}
          >
            <LinkIcon className="size-4" />
            Shorten a URL
          </Button>
        </motion.div>

        {/* Subtle grid pattern */}
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.5 0 0 / 0.07) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </div>
    </section>
  );
}
