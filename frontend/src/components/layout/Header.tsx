'use client';

import { Bell, UserCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useState } from 'react';

// Title mapping for routes
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/ternak': 'Manajemen Ternak',
  '/dashboard/pakan': 'Manajemen Pakan',
  '/dashboard/hasil': 'Hasil Produksi Susu',
  '/dashboard/limbah': 'Pengolahan Limbah',
  '/dashboard/transaksi': 'Transaksi Koperasi',
  '/dashboard/laporan': 'Laporan & Statistik',
  '/dashboard/anggota': 'Data Anggota',
  '/dashboard/pengaturan': 'Pengaturan Sistem',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  
  // Prevent hydration errors by using state for title
  const [title, setTitle] = useState('Dashboard');
  
  useEffect(() => {
    // Exact match
    if (ROUTE_TITLES[pathname]) {
      setTitle(ROUTE_TITLES[pathname]);
      return;
    }
    
    // Partial match for nested routes (e.g., /dashboard/ternak/1)
    const baseRoute = Object.keys(ROUTE_TITLES)
      .sort((a, b) => b.length - a.length)
      .find((route) => route !== '/dashboard' && pathname.startsWith(route));
      
    if (baseRoute) {
      setTitle(ROUTE_TITLES[baseRoute]);
    } else {
      setTitle('MooOS');
    }
  }, [pathname]);

  const handleLogout = () => {
    // TODO: Clear token / call auth hook logout
    router.push('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-none bg-transparent">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">Menu Profil</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/pengaturan')}>
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
