"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { AnalyticsSummary } from "@/types";

export default function AdminDashboardPage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <section className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <section className="flex gap-2">
            <Link href="/admin/intents">
              <Button variant="outline">Manage Intents</Button>
            </Link>
            <Link href="/admin/agents">
              <Button variant="outline">Agents</Button>
            </Link>
            <Link href="/admin/live-chat">
              <Button>Live Chat</Button>
            </Link>
          </section>
        </section>
        {loading ? (
          <p className="text-zinc-500">Loading analytics...</p>
        ) : data ? (
          <AnalyticsCharts data={data} />
        ) : (
          <p className="text-red-500">Failed to load analytics</p>
        )}
      </main>
    </section>
  );
}
