"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  ["Dashboard", "/"],
  ["Foods", "/foods"],
  ["Recipes", "/recipes"],
  ["Planner", "/planner"],
  ["Shopping", "/shopping"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-white focus:p-4"
      >
        Skip to content
      </a>
      <aside className="border-b border-stone-200 bg-white p-6 md:border-r md:border-b-0">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-emerald-900"
        >
          Cadence
          <span className="block text-xs font-normal tracking-normal text-stone-500">
            A little structure. A better week.
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="mt-8 flex flex-wrap gap-2 md:flex-col"
        >
          {navigation.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname === href ? "bg-emerald-50 text-emerald-900" : "text-stone-600 hover:bg-stone-100"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-10 hidden text-xs text-stone-500 md:block">
          Your personal nutrition workspace
        </p>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-6 py-10 outline-none md:px-12 md:py-16"
      >
        {children}
      </main>
    </div>
  );
}
