"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { AnalyticsSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface AnalyticsChartsProps {
  data: AnalyticsSummary;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const stats = [
    { label: "Total Chats", value: data.totalChats },
    { label: "Failed Intents", value: data.failedIntents },
    { label: "Avg Response (ms)", value: data.averageResponseTime },
    { label: "Escalation Rate", value: `${data.escalationRate}%` },
    { label: "Active Users", value: data.activeUsers },
    { label: "AI Accuracy", value: `${data.aiAccuracy}%` },
  ];

  return (
    <section className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-violet-600">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Chats</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyChats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topIntents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="intent" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Intent Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.topIntents}
                  dataKey="count"
                  nameKey="intent"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.topIntents.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
