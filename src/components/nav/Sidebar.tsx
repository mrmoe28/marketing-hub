"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Upload, Mail, Plus, Sparkles, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Sparkles },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/campaigns/new", label: "New Campaign", icon: Plus, highlighted: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Clientbase</h1>
              <p className="text-xs text-muted-foreground">Email campaigns</p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");

          if (link.highlighted) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/50",
                  "hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                <Sparkles className="ml-auto h-3 w-3 opacity-70" />
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/10 to-violet-600/10" />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg border bg-gradient-to-br from-blue-600/10 to-violet-600/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium">AI-Powered</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Human-sounding emails written by Claude
          </p>
        </div>
      </div>
    </div>
  );
}
