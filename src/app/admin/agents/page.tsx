"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isOnline: boolean;
}

export default function AdminAgentsPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);

  const load = () => {
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const updateRole = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, role }),
    });
    load();
  };

  return (
    <section className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User & Agent Management</h1>
          <Link href="/admin">
            <Button variant="outline">← Dashboard</Button>
          </Link>
        </section>

        <section className="space-y-3">
          {users.map((user) => (
            <Card key={user._id}>
              <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
                <section>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                  <section className="flex gap-2 mt-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant={user.isOnline ? "success" : "outline"}>
                      {user.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </section>
                </section>
                <section className="flex gap-2">
                  {user.role !== "support-agent" && (
                    <Button size="sm" variant="outline" onClick={() => updateRole(user._id, "support-agent")}>
                      Make Agent
                    </Button>
                  )}
                  {user.role !== "admin" && (
                    <Button size="sm" variant="outline" onClick={() => updateRole(user._id, "admin")}>
                      Make Admin
                    </Button>
                  )}
                  {user.role !== "user" && (
                    <Button size="sm" variant="ghost" onClick={() => updateRole(user._id, "user")}>
                      Make User
                    </Button>
                  )}
                </section>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </section>
  );
}
