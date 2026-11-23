"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMOS = [
  { email: "admin@demo.local", password: "admin", label: "Admin" },
  { email: "manager@demo.local", password: "manager", label: "Manager Max" },
  { email: "manager2@demo.local", password: "manager", label: "Manager Mira" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMOS[1].email);
  const [password, setPassword] = useState(DEMOS[1].password);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Mini CRM Funnel
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Демо-логин (cookie session, без реального IdP).
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Войти
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {DEMOS.map((d) => (
          <button
            key={d.email}
            type="button"
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
            onClick={() => {
              setEmail(d.email);
              setPassword(d.password);
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
    </main>
  );
}
