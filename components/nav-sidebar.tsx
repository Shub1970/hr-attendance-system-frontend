"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employ", label: "Employ" },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-full border-b border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] px-4 py-4 backdrop-blur md:w-64 md:border-r md:border-b-0 md:px-5 md:py-6">
      <div className="mb-4 flex items-center justify-between md:mb-8 md:block">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-[hsl(var(--sidebar-foreground))]">HR Suite</p>
        <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">People Ops</p>
      </div>

      <nav className="flex gap-2 md:flex-col">
        {links.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors md:px-4 md:py-3 ${
                isActive
                  ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                  : "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] hover:brightness-95"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
