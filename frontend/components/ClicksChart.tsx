"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClicksChartProps {
  data: { date: string; clicks: number }[];
  title?: string;
  period: string;
}

export function ClicksChart({
  data,
  title = "Clicks Over Time",
  period,
}: ClicksChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No click data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.25 270)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.25 270)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="oklch(0.5 0 0 / 0.3)"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="oklch(0.5 0 0 / 0.3)"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.2 0 0)",
                  border: "1px solid oklch(0.3 0 0)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "oklch(0.9 0 0)",
                }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="oklch(0.65 0.25 270)"
                strokeWidth={2}
                fill="url(#clickGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// --- Comparison Chart ---

interface ComparisonChartProps {
  pathAData: { date: string; clicks: number }[];
  pathBData: { date: string; clicks: number }[];
  period: string;
}

export function ComparisonChart({
  pathAData,
  pathBData,
  period,
}: ComparisonChartProps) {
  // Merge both datasets by date
  const dateMap = new Map<string, { pathA: number; pathB: number }>();

  pathAData.forEach((d) => {
    const label = formatDate(d.date, period);
    const existing = dateMap.get(label) || { pathA: 0, pathB: 0 };
    existing.pathA = d.clicks;
    dateMap.set(label, existing);
  });

  pathBData.forEach((d) => {
    const label = formatDate(d.date, period);
    const existing = dateMap.get(label) || { pathA: 0, pathB: 0 };
    existing.pathB = d.clicks;
    dateMap.set(label, existing);
  });

  const mergedData = Array.from(dateMap.entries()).map(([label, values]) => ({
    label,
    ...values,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Path A vs Path B</CardTitle>
      </CardHeader>
      <CardContent>
        {mergedData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No comparison data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mergedData}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.25 270)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.25 270)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.2 160)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.2 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.5 0 0 / 0.3)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0 0 / 0.3)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.2 0 0)",
                  border: "1px solid oklch(0.3 0 0)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "oklch(0.9 0 0)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="pathA"
                name="Path A (Bitly→Tracker→Original)"
                stroke="oklch(0.65 0.25 270)"
                strokeWidth={2}
                fill="url(#gradA)"
              />
              <Area
                type="monotone"
                dataKey="pathB"
                name="Path B (Tracker→Bitly→Original)"
                stroke="oklch(0.7 0.2 160)"
                strokeWidth={2}
                fill="url(#gradB)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// --- Helpers ---

function formatDate(dateStr: string, period: string): string {
  const d = new Date(dateStr);
  if (period === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
