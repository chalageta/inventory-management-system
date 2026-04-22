'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Tags,
  LogOut,
  Boxes,
  History,
  Users,
  Shield,
  KeyRound,
  BarChart3,
  TrendingUp
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ================= NAV ITEMS =================
const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },

  { href: '/categories', label: 'Categories', icon: Tags, permission: 'view_categories' },

  { href: '/users', label: 'Manage Users', icon: Users, permission: 'manage_users' },

  { href: '/products', label: 'Products', icon: Package, permission: 'view_products' },

  { href: '/purchases', label: 'Manage Purchases', icon: Package, permission: 'manage_purchases' },

  { href: '/inventory', label: 'Current Stock', icon: Boxes, permission: 'view_inventory' },

  { href: '/sales', label: 'Sales / Out', icon: ShoppingCart, permission: 'view_sales' },

  { href: '/stock-logs', label: 'Stock Logs', icon: History, permission: 'view_logs' },

  // ================= REPORTS (REMOVED SINGLE LINK) =================
  {
    label: 'Reports',
    icon: FileText,
    permission: 'view_reports',
    children: [
      {
        href: '/reports/sales',
        label: 'Sales Report',
        icon: BarChart3,
        permission: 'view_reports',
      },
      {
        href: '/reports/top-products',
        label: 'Top Products',
        icon: TrendingUp,
        permission: 'view_reports',
      },
    ],
  },

  { href: '/admin/roles', label: 'Role Management', icon: Shield, permission: 'manage_roles' },

  { href: '/admin/permissions', label: 'Permission Management', icon: KeyRound, permission: 'manage_permissions' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, can, logout } = useAuth();
  const [openReports, setOpenReports] = useState(true);

  // ================= FILTER =================
  const filteredNav = allNavItems.filter((item) => {
    if (!item.permission) return true;
    if (user?.role_name === 'Admin') return true;
    return can(item.permission);
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground shadow-sm">

      {/* LOGO */}
      <div className="flex h-16 items-center justify-center bg-primary shrink-0">
        <Image
          src="/images/logo/gilando_logo.webp"
          alt="Logo"
          width={140}
          height={50}
          className="w-[140px] h-auto"
          priority
        />
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">

        {filteredNav.map((item) => {

          // ================= REPORTS SECTION =================
          if ('children' in item) {
            return (
              <div key={item.label} className="space-y-1">

                {/* Parent */}
                <button
                  onClick={() => setOpenReports(!openReports)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>

                {/* Children */}
                {openReports && (
                  <div className="ml-6 space-y-1 border-l pl-3">
                    {item.children.map((child) => {
                      const isActive =
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                            isActive
                              ? 'text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ================= NORMAL ITEMS =================
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* USER INFO */}
      {user && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
          Role: {user.role_name}
        </div>
      )}

      {/* LOGOUT */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}