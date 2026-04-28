/**
 * API client for communicating with the FastAPI backend.
 * All requests include credentials for HTTP-only cookie auth.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Types ---

export interface AnalyticsData {
  bitlink: string;
  total_clicks: number;
  unique_visitors?: number;
  clicks_by_day: { date: string; clicks: number }[];
  unit: string;
  period: string;
}

export interface TrackingPath {
  code: string;
  tracker_url: string;
  flow: string;
  description: string;
}

export interface TrackingData {
  path_a: TrackingPath;
  path_b: TrackingPath;
  original_url: string;
  bitly_url: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  short_url?: string | null;
  long_url?: string | null;
  qr_code_base64?: string | null;
  analytics?: AnalyticsData | null;
  tracking?: TrackingData | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  short_url?: string | null;
  long_url?: string | null;
  qr_code_base64?: string | null;
  analytics?: AnalyticsData | null;
  tracking?: TrackingData | null;
  timestamp: Date;
}

// --- Dashboard Types ---

export interface DashboardStats {
  total_links: number;
  total_clicks: number;
  clicks_over_time: { date: string; clicks: number }[];
  period: string;
}

export interface LinkItem {
  code: string;
  original_url: string;
  bitly_url: string;
  tracker_url: string;
  total_clicks: number;
  created_at: string;
}

export interface LinksResponse {
  links: LinkItem[];
  total: number;
}

export interface LinkAnalytics {
  code: string;
  original_url: string;
  total_clicks: number;
  clicks_over_time: { date: string; clicks: number }[];
  period: string;
}

export type Period = "24h" | "3d" | "7d" | "1month";

// --- Chat API ---

export async function sendChatMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      message,
      session_id: sessionId || null,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function shortenUrl(url: string) {
  const res = await fetch(`${API_BASE}/api/shorten`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getAnalytics(bitlink: string) {
  const res = await fetch(`${API_BASE}/api/analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bitlink }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Dashboard API ---

export async function getDashboardStats(
  period: Period = "7d"
): Promise<DashboardStats> {
  const res = await fetch(
    `${API_BASE}/api/dashboard/stats?period=${period}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function getUserLinks(limit = 20): Promise<LinksResponse> {
  const res = await fetch(
    `${API_BASE}/api/dashboard/links?limit=${limit}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch links");
  return res.json();
}

export async function getLinkAnalytics(
  code: string,
  period: Period = "7d"
): Promise<LinkAnalytics> {
  const res = await fetch(
    `${API_BASE}/api/dashboard/links/${code}/analytics?period=${period}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch link analytics");
  return res.json();
}


