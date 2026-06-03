'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, Users2,
  ClipboardCheck, CreditCard, BarChart3, Bell, UserCog, ChevronLeft,
  School,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { href: '/students', label: "O'quvchilar", icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] },
  { href: '/teachers', label: "O'qituvchilar", icon: School, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { href: '/courses', label: 'Kurslar', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] },
  { href: '/groups', label: 'Guruhlar', icon: Users2, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] },
  { href: '/attendance', label: 'Davomat', icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] },
  { href: '/payments', label: "To'lovlar", icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { href: '/reports', label: 'Hisobotlar', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { href: '/notifications', label: 'Bildirishnomalar', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'] },
  { href: '/users', label: 'Foydalanuvchilar', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  const filteredItems = navItems.filter((item) =>
    !user?.role || item.roles.includes(user.role),
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sidebar-foreground text-sm">EduCRM Pro</span>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        )}
        {sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse button when closed */}
      {!sidebarOpen && (
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
    </aside>
  );
}
