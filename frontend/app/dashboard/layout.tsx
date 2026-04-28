"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SparklesIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  HomeIcon,
} from "lucide-react";
import { getMe, logout } from "@/lib/auth";
import type { User } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r bg-background lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b px-5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SparklesIcon className="size-3.5" />
          </div>
          <span className="text-sm font-semibold">LinkBot</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium">
            <LayoutDashboardIcon className="size-4 text-muted-foreground" />
            Dashboard
          </div>
          <Link href="/">
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground">
              <HomeIcon className="size-4" />
              Home
            </div>
          </Link>
        </nav>

        {/* User footer */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{user?.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOutIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SparklesIcon className="size-3.5" />
          </div>
          <span className="text-sm font-semibold">LinkBot</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <span className="text-xs text-muted-foreground">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs">
              Home
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
          >
            <LogOutIcon className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Main content — offset by sidebar width on desktop */}
      <main className="px-4 py-6 lg:ml-56 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
