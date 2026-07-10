'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Beef,
  Wheat,
  Milk,
  Recycle,
  Receipt,
  FileBarChart,
  Users,
  Settings,
} from 'lucide-react';

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';

const MENU_ITEMS = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Ternak', icon: Beef, href: '/dashboard/ternak' },
  { title: 'Pakan', icon: Wheat, href: '/dashboard/pakan' },
  { title: 'Hasil Susu', icon: Milk, href: '/dashboard/hasil' },
  { title: 'Limbah', icon: Recycle, href: '/dashboard/limbah' },
  { title: 'Transaksi', icon: Receipt, href: '/dashboard/transaksi' },
  { title: 'Laporan', icon: FileBarChart, href: '/dashboard/laporan' },
  { title: 'Anggota', icon: Users, href: '/dashboard/anggota' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <ShadcnSidebar variant="inset">
      <SidebarHeader className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Beef className="h-6 w-6" />
          <span>MooOS</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/pengaturan'}>
              <Link href="/dashboard/pengaturan">
                <Settings className="h-4 w-4" />
                <span>Pengaturan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
