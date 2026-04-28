"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, SparklesIcon, ZapIcon, CheckCircle2Icon, BarChart3Icon, ArrowRightIcon } from "lucide-react";

interface HeroSectionProps {
  onOpenChat: () => void;
}

export function HeroSection({ onOpenChat }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6">


      <div className="relative z-10 mx-auto max-w-6xl grid items-center gap-12 lg:grid-cols-2">
        {/* Left Content */}
        <div className="flex flex-col text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Badge variant="outline" className="mb-6 w-fit gap-1.5 px-3 py-1">
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
            Shorten Smarter with AI
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          >
            An intelligent agent that creates Bitly short links, tracks analytics,
            and answers your questions — all through natural conversation.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col justify-start gap-3 sm:flex-row"
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

          {/* Additional trust content on the left */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-primary" />
              <span>Real-time analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-primary" />
              <span>Powered by Gemini</span>
            </div>
          </motion.div>
        </div>

        {/* Right Content / Illustration */}
        <motion.div
          className="relative hidden lg:flex items-center justify-center h-full w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Main Mockup Container */}
          <div className="relative w-[450px] overflow-hidden rounded-2xl border bg-background/50 p-6 shadow-2xl backdrop-blur-sm">
            {/* Mock Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <SparklesIcon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">LinkBot Agent</div>
                  <div className="text-xs text-muted-foreground">Online • Ready to assist</div>
                </div>
              </div>
            </div>

            {/* Mock Chat Area */}
            <div className="flex flex-col gap-4">
              {/* User Message */}
              <div className="self-end rounded-2xl rounded-tr-sm bg-foreground px-4 py-2.5 text-sm text-background shadow-sm">
                Shorten github.com and show me the click stats!
              </div>

              {/* Bot Message */}
              <div className="self-start rounded-2xl rounded-tl-sm border bg-muted/50 px-4 py-3 text-sm text-foreground shadow-sm">
                <p className="mb-3">Done! I've shortened your link and fetched the latest analytics.</p>
                
                {/* Mock Card inside Bot Message */}
                <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                        <LinkIcon className="size-3 text-foreground" />
                      </div>
                      <span className="font-medium text-foreground">bit.ly/github-repo</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  
                  <div className="mt-1 flex items-end gap-2">
                    <BarChart3Icon className="size-4 text-muted-foreground" />
                    <span className="text-xl font-bold leading-none">1,248</span>
                    <span className="text-xs text-muted-foreground">clicks this week</span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-primary cursor-pointer">
                  View full report <ArrowRightIcon className="size-3" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements behind the mockup */}
          <div className="absolute -right-8 -top-8 -z-10 h-64 w-64 rounded-full border border-dashed border-foreground/20" />
          <div className="absolute -bottom-12 -left-12 -z-10 h-48 w-48 rounded-full border border-foreground/10" />
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
