'use client';

import { Bell, UserCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Title mapping for routes
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/ternak': 'Manajemen Ternak',
  '/dashboard/pakan': 'Manajemen Pakan',
  '/dashboard/hasil': 'Hasil Produksi Susu',
  '/dashboard/limbah': 'Pengolahan Limbah',
  '/dashboard/laporan': 'Laporan & Statistik',
  '/dashboard/anggota': 'Data Anggota',
  '/dashboard/pengaturan': 'Pengaturan Sistem',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
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
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifikasi</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold text-sm">Notifikasi</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{unreadCount} baru</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ada notifikasi
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex flex-col gap-1 p-3 border-b text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                      !notif.read && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notif.read) markAsRead([notif.id]);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("font-medium", !notif.read && "text-primary")}>
                        {notif.title}
                      </span>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: idLocale })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t">
              <Button variant="outline" className="w-full text-xs h-8" onClick={() => router.push('/dashboard/notifikasi')}>
                Lihat Semua
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-none bg-transparent">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">Menu Profil</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/pengaturan')}>
                Pengaturan
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
