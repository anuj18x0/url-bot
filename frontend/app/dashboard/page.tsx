"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStats } from "@/components/DashboardStats";
import { ClicksChart } from "@/components/ClicksChart";
import { LinksTable } from "@/components/LinksTable";
import {
  getDashboardStats,
  getUserLinks,
} from "@/lib/api";
import type {
  DashboardStats as StatsType,
  LinkItem,
  Period,
} from "@/lib/api";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [stats, setStats] = useState<StatsType | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, linksData] = await Promise.all([
        getDashboardStats(period),
        getUserLinks(50),
      ]);
      setStats(statsData);
      setLinks(linksData.links);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header — left-aligned */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your link performance and compare redirect paths.
          </p>
        </motion.div>

        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="3d">3 Days</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="1month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards — left-aligned grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <DashboardStats
          totalLinks={stats.total_links}
          totalClicks={stats.total_clicks}
          period={period}
        />
      ) : null}

      {/* Charts — single column layout now that comparison is gone */}
      <div className="grid gap-6">
        {/* Main clicks chart */}
        {loading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : stats ? (
          <ClicksChart
            data={stats.clicks_over_time}
            title="Total Clicks"
            period={period}
          />
        ) : null}
      </div>

      {/* Links Table — full width */}
      {loading ? (
        <Skeleton className="h-60 rounded-xl" />
      ) : (
        <LinksTable
          links={links}
        />
      )}
    </div>
  );
}
