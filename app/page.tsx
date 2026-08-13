import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import { ContextPanel } from "@/components/dashboard/ContextPanel";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <ChatWindow />
      </div>
      <ContextPanel />
    </div>
  );
}
