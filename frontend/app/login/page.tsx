"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SparklesIcon,
  LogInIcon,
  LinkIcon,
  BarChart3Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        {/* Animated gradient orbs */}
        <motion.div
          className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.25 270), transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15 blur-[80px]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.2 160), transparent 70%)",
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-background text-foreground">
            <SparklesIcon className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LinkBot</span>
        </div>

        {/* Value props */}
        <div className="relative z-10 max-w-md">
          <motion.h1
            className="text-3xl font-bold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Shorten smarter.
            <br />
            Track everything.
          </motion.h1>
          <motion.p
            className="mt-4 text-sm leading-relaxed text-background/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            AI-powered URL shortening with dual-path click tracking,
            real-time analytics, and Bitly integration.
          </motion.p>

          <motion.div
            className="mt-8 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              { icon: LinkIcon, text: "Instant Bitly URL shortening" },
              { icon: BarChart3Icon, text: "A/B path performance tracking" },
              { icon: ShieldCheckIcon, text: "Secure HTTP-only auth" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-md bg-background/10">
                  <item.icon className="size-3.5 text-background/70" />
                </div>
                <span className="text-sm text-background/70">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-background/30">
          Built with Next.js, FastAPI, Gemini AI & Bitly
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SparklesIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold">LinkBot</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="h-10 w-full gap-2"
              disabled={loading}
            >
              <LogInIcon className="size-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
