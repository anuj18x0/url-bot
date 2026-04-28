"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon, MousePointerClickIcon, TrendingUpIcon } from "lucide-react";

interface DashboardStatsProps {
  totalLinks: number;
  totalClicks: number;
  period: string;
}

export function DashboardStats({
  totalLinks,
  totalClicks,
  period,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Total Links",
      value: totalLinks,
      icon: LinkIcon,
      gradient: "from-violet-500/10 to-purple-500/10",
    },
    {
      label: `Clicks (${period})`,
      value: totalClicks,
      icon: MousePointerClickIcon,
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      label: "Avg. per Link",
      value: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
      icon: TrendingUpIcon,
      gradient: "from-rose-500/10 to-pink-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card>
            <CardContent className="flex items-center gap-4 pt-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient}`}
              >
                <stat.icon className="size-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
