import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_24%,#f3f8ff_100%)]">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
