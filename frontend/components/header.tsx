"use client";

import { useState } from "react";
import {
  Menu as MenuIcon,
  UserCircle,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Dropdown, Skeleton, MenuProps } from "antd";

export function Header() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

 const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

const imageUrl =
  user?.image && user.image.startsWith("/uploads")
    ? `${BASE_URL}${user.image}`
    : null;
  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="px-2 py-2 border-b mb-1">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Account
          </p>
          <p className="text-sm font-bold text-slate-700 truncate">
            {user?.email}
          </p>
        </div>
      ),
      disabled: true,
    },
    {
      key: "profile",
      label: (
        <Link href="/profile" className="px-2 py-1 block">
          View Profile
        </Link>
      ),
    },
    {
      key: "security",
      label: (
        <Link href="/change-password" className="px-2 py-1 block">
          Security Settings
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      danger: true,
      label: (
        <button onClick={logout} className="w-full text-left px-2 py-1">
          Sign Out
        </button>
      ),
    },
  ];

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-white/80 backdrop-blur border-b px-6">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onClose={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="lg:hidden font-bold text-primary">
          Gilando IMS
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {loading ? (
          <Skeleton.Avatar active size="large" />
        ) : (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <div className="flex items-center gap-3 cursor-pointer">

              {/* USER INFO */}
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-bold text-slate-900">
                  {user?.name || "User"}
                </span>

                <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {user?.role_name || "Guest"}
                </span>
              </div>

              {/* AVATAR */}
              <div className="relative">
                <div className="h-10 w-10 rounded-full overflow-hidden border flex items-center justify-center bg-blue-50">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={user?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {getInitials(user?.name || "")}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 bg-white rounded-full border p-0.5">
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </div>
              </div>

            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
}