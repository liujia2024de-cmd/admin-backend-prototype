import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Boxes,
  FileStack,
  LifeBuoy,
  LineChart,
  Megaphone,
  NotebookText,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AdvinciLogo } from "@/components/brand/AdvinciLogo";
import { navAccessList, readSession } from "@/lib/auth";

const iconMap = {
  "/dashboard": LineChart,
  "/users": Users,
  "/devices": RadioTower,
  "/ota": Boxes,
  "/logs": NotebookText,
  "/ai-feedback/videos": Sparkles,
  "/tickets": LifeBuoy,
  "/operations": Megaphone,
  "/cms/faq": FileStack,
  "/infra": Activity,
  "/admin/roles": ShieldCheck,
} as const;

export function Sidebar() {
  const location = useLocation();
  const session = readSession();
  const navItems = navAccessList.filter((item) => session && item.roles.includes(session.role));

  return (
    <aside className="sticky top-0 hidden h-screen min-h-0 w-72 shrink-0 flex-col border-r border-[#cfe4ff] bg-[linear-gradient(180deg,#1B8BFA_0%,#167fe6_42%,#126fd0_100%)] text-white lg:flex">
      <div className="flex min-h-[101px] flex-col justify-center border-b border-white/16 px-6 py-3.5">
        <AdvinciLogo tone="light" size="md" stacked />
        <div className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-white/78">
          达芬奇黑洞IOT管理后台
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-4">
        <nav className="space-y-[11px] pt-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = iconMap[item.path as keyof typeof iconMap];
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-2.5 rounded-[18px] px-2.5 py-3 transition-all duration-200 ${
                  active
                    ? "bg-white text-[#1B8BFA] shadow-[0_18px_40px_rgba(8,53,123,0.18)]"
                    : "text-white/78 hover:bg-white/12 hover:pl-3 hover:text-white"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-[#e8f3ff] text-[#1B8BFA]" : "bg-white/12 text-white/90"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{item.label}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
