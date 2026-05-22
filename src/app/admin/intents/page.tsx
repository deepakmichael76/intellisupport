"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

interface IntentItem {
  _id: string;
  intentName: string;
  examples: string[];
  responses: string[];
  usageCount: number;
  failCount: number;
}

export default function AdminIntentsPage() {
  const { accessToken } = useAuthStore();
  const [intents, setIntents] = useState<IntentItem[]>([]);
  const [intentName, setIntentName] = useState("");
  const [examples, setExamples] = useState("");
  const [responses, setResponses] = useState("");

  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  const load = () => {
    fetch("/api/admin/intents", { headers })
      .then((r) => r.json())
      .then((d) => setIntents(d.intents || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/intent", {
      method: "POST",
      headers,
      body: JSON.stringify({
        intentName,
        examples: examples.split("\n").filter(Boolean),
        responses: responses.split("\n").filter(Boolean),
      }),
    });
    setIntentName("");
    setExamples("");
    setResponses("");
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/intents?id=${id}`, { method: "DELETE", headers });
    load();
  };

  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Intent Management</h1>
          <Link href="/admin">
            <Button variant="outline">← Dashboard</Button>
          </Link>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Add / Update Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input placeholder="Intent name (e.g. order_status)" value={intentName} onChange={(e) => setIntentName(e.target.value)} required />
              <textarea
                className="w-full min-h-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-3 text-sm"
                placeholder="Training examples (one per line)"
                value={examples}
                onChange={(e) => setExamples(e.target.value)}
                required
              />
              <textarea
                className="w-full min-h-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-3 text-sm"
                placeholder="Bot responses (one per line)"
                value={responses}
                onChange={(e) => setResponses(e.target.value)}
                required
              />
              <Button type="submit">Save Intent</Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          {intents.map((intent) => (
            <Card key={intent._id}>
              <CardContent className="pt-6 flex justify-between items-start">
                <section>
                  <h3 className="font-semibold">{intent.intentName}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Used {intent.usageCount}x · Failed {intent.failCount}x
                  </p>
                  <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">
                    Examples: {intent.examples.slice(0, 3).join(", ")}
                  </p>
                </section>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(intent._id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </section>
  );
}
