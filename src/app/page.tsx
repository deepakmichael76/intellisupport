import Link from "next/link";
import { MessageSquare, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-violet-600">SupportAI</span>
        <nav className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
          AI-Powered Customer Support
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          Automate support with NLP intent recognition, real-time chat, live agent escalation,
          and enterprise analytics — built with Next.js, MongoDB, and Rasa/OpenAI.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup">
            <Button size="lg">Start Free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6 pb-20">
        {[
          { icon: MessageSquare, title: "Smart Chatbot", desc: "Rasa + OpenAI with confidence-based escalation" },
          { icon: Zap, title: "Real-time Support", desc: "Socket.IO live agent handover when AI needs help" },
          { icon: Shield, title: "Enterprise Ready", desc: "JWT auth, RBAC, analytics, and admin training" },
        ].map(({ icon: Icon, title, desc }) => (
          <article
            key={title}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
          >
            <Icon className="h-8 w-8 text-violet-600 mb-4" />
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-zinc-500">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
