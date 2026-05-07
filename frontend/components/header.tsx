"use client";

import { Menu, Bell, Search, ChevronDown, AlertTriangle, Package, DollarSign, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Dropdown, Skeleton, MenuProps, Input, Badge } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export function Header({ setSidebarOpen }: any) {
  const { user, logout, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      fetchNotifications();
    }
  }, [loading, user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/reports/notifications');
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const menuItems: MenuProps["items"] = [
    { key: "profile", label: <Link href="/profile">Profile</Link> },
    { key: "security", label: <Link href="/change-password">Security</Link> },
    { type: "divider" },
    {
      key: "logout",
      danger: true,
      label: <button onClick={logout}>Logout</button>,
    },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />;
      case 'success': return <Package className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />;
      case 'info': return <DollarSign className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />;
      default: return <Info className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />;
    }
  };

  const notificationItems: MenuProps["items"] = notifications.length > 0 
    ? notifications.map((n, idx) => ({
        key: n.id || idx,
        label: (
          <div className="flex items-start gap-3 p-2 w-64 whitespace-normal">
            {getIconForType(n.type)}
            <div>
              <p className="font-semibold text-sm text-gray-800">{n.title}</p>
              <p className="text-xs text-gray-500">{n.message}</p>
            </div>
          </div>
        ),
      })).flatMap((item, idx, array) => 
        idx < array.length - 1 ? [item, { type: "divider", key: `div-${idx}` }] : [item]
      )
    : [
        {
          key: "empty",
          label: (
            <div className="p-4 text-center text-gray-500 w-64">
              <p className="text-sm">No new notifications</p>
            </div>
          )
        }
      ];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white border-b px-4 md:px-6">

      {/* LEFT */}
      <div className="flex items-center gap-3 w-full">

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex w-80">
          <Input 
            prefix={<Search className="text-gray-400 h-4 w-4" />} 
            placeholder="Search..." 
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* NOTIFICATIONS */}
        <Dropdown menu={{ items: notificationItems }} trigger={["click"]} placement="bottomRight">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Bell className="h-5 w-5 text-gray-600" />
            </Badge>
          </button>
        </Dropdown>

        {loading ? (
          <Skeleton.Avatar active />
        ) : (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <div className="flex items-center gap-2 cursor-pointer text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <span className="hidden sm:block font-medium">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
}