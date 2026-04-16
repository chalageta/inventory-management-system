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
  KeyRound
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

// ================= NAV ITEMS =================
const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },

  { href: '/categories', label: 'Categories', icon: Tags, permission: 'view_categories' },

  { href: '/users', label: 'Manage Users', icon: Users, permission: 'manage_users' },

  { href: '/products', label: 'Products', icon: Package, permission: 'view_products' },
  { href: '/purchases', label: 'Purchases', icon: Package, permission: 'view_purchases' },
  { href: '/inventory', label: 'Current Stock', icon: Boxes, permission: 'view_inventory' },

  { href: '/sales', label: 'Sales / Out', icon: ShoppingCart, permission: 'view_sales' },

  { href: '/stock-logs', label: 'Stock Logs', icon: History, permission: 'view_logs' },

  { href: '/reports', label: 'Reports', icon: FileText, permission: 'view_reports' },

  { href: '/admin/roles', label: 'Role Management', icon: Shield, permission: 'manage_roles' },

  { href: '/admin/permissions', label: 'Permission Management', icon: KeyRound, permission: 'manage_permissions' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, can, logout } = useAuth();

  // ================= FILTER =================
  const filteredNav = allNavItems.filter((item) => {
    if (!item.permission) return true;

    // ✅ ADMIN sees ALL
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
          className="object-contain"
        />
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {filteredNav.map((item) => {
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