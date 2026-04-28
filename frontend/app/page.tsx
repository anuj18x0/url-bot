"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ChatWidget } from "@/components/ChatWidget";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LinkIcon,
  MessageCircleIcon,
  BarChart3Icon,
  ArrowRightIcon,
  SparklesIcon,
  LayoutDashboardIcon,
  LogInIcon,
} from "lucide-react";
import { getMe, logout } from "@/lib/auth";
import type { User } from "@/lib/auth";

export default function Page() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then((u) => setUser(u));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Nav bar */}
      <nav className="absolute left-0 right-0 top-0 z-20 mx-4 mt-6 flex items-center justify-between rounded-xl bg-transparent px-6 py-4 max-w-7xl xl:mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SparklesIcon className="size-4" />
          </div>
          <span className="text-sm font-semibold">LinkBot</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LayoutDashboardIcon className="size-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <LogInIcon className="size-3.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <HeroSection onOpenChat={() => setIsChatOpen(true)} />

      {/* Features */}
      <FeaturesSection />

      {/* How it works section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Three simple steps to smarter links.
            </p>
          </motion.div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-4">
            {[
              {
                icon: MessageCircleIcon,
                step: "1",
                title: "Ask the Agent",
                desc: "Type naturally — paste a URL or ask a question.",
              },
              {
                icon: LinkIcon,
                step: "2",
                title: "AI Decides",
                desc: "The agent calls Bitly, fetches analytics, or responds.",
              },
              {
                icon: BarChart3Icon,
                step: "3",
                title: "Get Results",
                desc: "Receive short links, QR codes, and analytics instantly.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="flex flex-1 flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="relative">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="size-5 text-foreground/70" />
                  </div>
                  <Badge
                    variant="default"
                    className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
                  >
                    {item.step}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
                {i < 2 && (
                  <ArrowRightIcon className="hidden size-4 rotate-90 text-muted-foreground/30 sm:block sm:rotate-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="px-6 py-10 text-center">
        <p className="text-xs text-muted-foreground">
          Built with Next.js, FastAPI & Bitly •{" "}
          <span className="text-foreground/60">LinkBot</span>
        </p>
      </footer>

      {/* Chat Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />
    </main>
  );
}
