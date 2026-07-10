'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Beef,
  Leaf,
  BarChart2,
  Sprout,
  CreditCard,
  FileText,
  Users,
  Settings,
  Info,
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
  { title: 'Dashboard', icon: LayoutGrid, href: '/dashboard' },
  { title: 'Anggota', icon: Users, href: '/dashboard/anggota' },
  { title: 'Ternak', icon: Beef, href: '/dashboard/ternak' },
  { title: 'Hasil', icon: BarChart2, href: '/dashboard/hasil' },
  { title: 'Limbah', icon: Leaf, href: '/dashboard/limbah' },
  { title: 'Pakan', icon: Sprout, href: '/dashboard/pakan' },
  { title: 'Transaksi', icon: CreditCard, href: '/dashboard/harga' },
  { title: 'Laporan', icon: FileText, href: '/dashboard/laporan' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <ShadcnSidebar collapsible="none">
      <SidebarHeader className="pt-8 pb-6 px-6 flex items-center">
        <div className="flex items-center w-full">
          <Image src="/mooos-logo.png" alt="MooOS Logo" width={150} height={40} className="h-10 w-auto object-contain" style={{ width: 'auto', height: 'auto' }} priority />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-0 h-full flex flex-col justify-between pb-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 tracking-widest mb-3 uppercase px-4">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive
                        ? "h-11 px-4 bg-[#eef8f0] text-[#1e8e3e] hover:bg-[#eef8f0] hover:text-[#166c30] font-semibold border-l-[4px] border-[#1e8e3e] rounded-l-none rounded-r-xl"
                        : "h-11 px-4 text-slate-500 hover:text-slate-800 hover:bg-transparent font-medium"}
                    >
                      <Link href={item.href} className="w-full flex items-center">
                        <item.icon className={`h-[20px] w-[20px] mr-3 ${isActive ? "text-[#1e8e3e]" : "text-slate-400"}`} strokeWidth={2} />
                        <span className="text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 tracking-widest mb-3 uppercase px-4">Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/dashboard/pengaturan'}
                  className={pathname === '/dashboard/pengaturan'
                    ? "h-11 px-4 bg-[#eef8f0] text-[#1e8e3e] hover:bg-[#eef8f0] hover:text-[#166c30] font-semibold border-l-[4px] border-[#1e8e3e] rounded-l-none rounded-r-xl"
                    : "h-11 px-4 text-slate-500 hover:text-slate-800 hover:bg-transparent font-medium"}
                >
                  <Link href="/dashboard/pengaturan" className="w-full flex items-center">
                    <Settings className={`h-[20px] w-[20px] mr-3 ${pathname === '/dashboard/pengaturan' ? "text-[#1e8e3e]" : "text-slate-400"}`} strokeWidth={2} />
                    <span className="text-[15px]">Pengaturan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/dashboard/tentang'}
                  className={pathname === '/dashboard/tentang'
                    ? "h-11 px-4 bg-[#eef8f0] text-[#1e8e3e] hover:bg-[#eef8f0] hover:text-[#166c30] font-semibold border-l-[4px] border-[#1e8e3e] rounded-l-none rounded-r-xl"
                    : "h-11 px-4 text-slate-500 hover:text-slate-800 hover:bg-transparent font-medium"}
                >
                  <Link href="/dashboard/tentang" className="w-full flex items-center">
                    <Info className={`h-[20px] w-[20px] mr-3 ${pathname === '/dashboard/tentang' ? "text-[#1e8e3e]" : "text-slate-400"}`} strokeWidth={2} />
                    <span className="text-[15px]">Tentang Sistem</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
}
