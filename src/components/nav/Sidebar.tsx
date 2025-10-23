"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Upload, Mail, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/campaigns/new", label: "New Campaign", icon: Plus },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Clientbase</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
