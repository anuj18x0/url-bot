"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  BarChart3Icon,
} from "lucide-react";
import type { LinkItem } from "@/lib/api";

interface LinksTableProps {
  links: LinkItem[];
  onViewAnalytics?: (code: string) => void;
}

export function LinksTable({ links, onViewAnalytics }: LinksTableProps) {
  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No links yet. Use the chatbot to shorten your first URL!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Links</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Original URL</th>
                <th className="px-4 py-2.5 font-medium">Tracker</th>
                <th className="px-4 py-2.5 font-medium text-right">Clicks</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {links.map((link, i) => (
                <LinkRow
                  key={link.code}
                  link={link}
                  index={i}
                  onViewAnalytics={onViewAnalytics}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkRow({
  link,
  index,
  onViewAnalytics,
}: {
  link: LinkItem;
  index: number;
  onViewAnalytics?: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.tracker_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "…" : str;

  return (
    <motion.tr
      className="border-b last:border-0 hover:bg-muted/30"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <td className="max-w-[200px] px-4 py-2.5">
        <a
          href={link.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-foreground/80 hover:text-foreground"
          title={link.original_url}
        >
          {truncate(link.original_url, 35)}
          <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
        </a>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <a
            href={link.tracker_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary hover:underline"
          >
            {truncate(link.tracker_url, 30)}
          </a>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckIcon className="size-3 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy tracker URL"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>

      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
        {link.total_clicks.toLocaleString()}
      </td>
      <td className="px-4 py-2.5 text-muted-foreground">
        {new Date(link.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-2.5">
        {onViewAnalytics && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onViewAnalytics(link.code)}
            title="View analytics"
          >
            <BarChart3Icon className="size-3.5" />
          </Button>
        )}
      </td>
    </motion.tr>
  );
}
