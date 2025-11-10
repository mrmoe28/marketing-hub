import { Sidebar } from "@/components/nav/Sidebar";
import { AgentChat } from "@/components/AgentChat";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-[1600px] p-4">{children}</div>
      </main>
      {/* Global AI Agent Chat - appears on all dashboard pages */}
      <AgentChat />
    </div>
  );
}
