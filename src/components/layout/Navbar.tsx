"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isStaff = user?.role === "admin" || user?.role === "support-agent";

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <Link href={isStaff ? "/admin" : "/chat"} className="font-bold text-violet-600 text-lg">
        SupportAI
      </Link>
      <section className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-zinc-500 hidden sm:inline">
            {user.name} · {user.role}
          </span>
        )}
        <Link href="/chat">
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" /> Chat
          </Button>
        </Link>
        {user?.role === "admin" && (
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="h-4 w-4 mr-1" /> Admin
            </Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </Button>
      </section>
    </nav>
  );
}
