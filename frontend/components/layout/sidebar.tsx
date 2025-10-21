'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  ClipboardList,
  Bell,
  Shield,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('WORKSPACE_ADMIN' | 'OPERATOR' | 'THERAPIST' | 'ACCOUNTANT')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Therapists',
    href: '/therapists',
    icon: Users,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Progress Reports',
    href: '/progress-reports',
    icon: FileText,
  },
  {
    title: 'Reschedule Requests',
    href: '/reschedule-requests',
    icon: ClipboardList,
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: DollarSign,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Audit Logs',
    href: '/audit-logs',
    icon: Shield,
    roles: ['WORKSPACE_ADMIN', 'OPERATOR'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['WORKSPACE_ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Therapy Center</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
