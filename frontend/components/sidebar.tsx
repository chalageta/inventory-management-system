"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Boxes,
  History,
  Users,
  Shield,
  KeyRound,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tags,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "manage Products", icon: LayoutGrid },
  { href: "/categories", label: "manage Categories", icon: Tags },
  { href: "/purchases", label: "manage Purchases", icon: Package },
  { href: "/inventory", label: "manage stock", icon: Boxes },
  { href: "/sales", label: "manage Sales", icon: ShoppingCart },
  { href: "/stock-logs", label: "Logs", icon: History },
  {
    label: "Reports",
    icon: FileText,
    children: [
      { href: "/reports/sales", label: "Sales Report", icon: BarChart3 },
      { href: "/reports/top-products", label: "Top Products", icon: TrendingUp },
    ],
  },
  { href: "/users", label: "manage Users", icon: Users },
  { href: "/admin/roles", label: "manage Roles", icon: Shield },
  { href: "/admin/permissions", label: "manage Permissions", icon: KeyRound },
];

export function Sidebar({ open, setOpen }: any) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [openReports, setOpenReports] = useState(false);

  useEffect(() => {
    setCollapsed(window.innerWidth < 1024);
  }, []);

  return (
    <TooltipProvider>
      {/* BACKDROP (mobile only) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <div
        className={cn(
          "fixed md:static z-50 h-screen bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300",
          collapsed ? "w-16" : "w-60",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-slate-800">
          {!collapsed && <span className="text-white font-semibold">Inventory</span>}

          <div className="flex gap-2">
            {/* close mobile */}
            <button className="md:hidden" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>

            <button onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {allNavItems.map((item: any) => {
            const hasChildren = "children" in item;
            const isActive = pathname === item.href;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenReports(!openReports)}
                    className="flex items-center gap-3 w-full py-2 px-2 hover:bg-white/5 rounded-lg"
                  >
                    <item.icon className="h-5 w-5" />
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && <ChevronDown className={openReports ? "rotate-180" : ""} />}
                  </button>

                  {openReports && !collapsed && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-slate-700 pl-3">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block text-sm py-2 hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 py-2 px-2 rounded-lg",
                  isActive ? "bg-primary text-white" : "hover:bg-white/5"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-3 border-t border-slate-800">
          <Button onClick={logout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}