'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttendance } from '@/hooks/useDashboard';
import { useSettings } from '@/hooks/useSettings';
import { toastSuccess, toastError } from '@/lib/notify';

export function AbsensiCard() {
  const { attendance, isClockedIn, isLoading, clockIn, clockOut, isSubmitting } = useAttendance();
  const { settings } = useSettings();

  const handleClockIn = async () => {
    try {
      await clockIn();
      toastSuccess('Berhasil absen masuk');
    } catch (error: any) {
      toastError(error.message || 'Gagal absen masuk');
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
      toastSuccess('Berhasil absen pulang');
    } catch (error: any) {
      toastError(error.message || 'Gagal absen pulang');
    }
  };

  const clockInTime = attendance?.clock_in
    ? new Date(attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-slate-200/50 rounded-xl p-6 flex flex-col items-center h-full text-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200 overflow-hidden relative">
        <Image 
          src="/vincelli.png" 
          alt="Profile Picture" 
          width={96}
          height={96}
          className="object-cover"
        />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Halo, Admin!</h2>
      <p className="text-sm text-slate-500 mt-1 mb-8">PIC {settings?.koperasi_name || 'Koperasi'}</p>

      <div className="w-full text-center space-y-2 mb-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat status kehadiran...</p>
        ) : isClockedIn ? (
          <div className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-medium animate-pulse inline-block">
            Sedang Bekerja (Masuk: {clockInTime})
          </div>
        ) : (
          <div className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full font-medium inline-block">
            Silakan absen untuk memulai shift
          </div>
        )}
      </div>

      <div className="w-full space-y-3 flex-1">
        <Button
          variant={isClockedIn ? 'outline' : 'default'}
          className={cn("w-full justify-start h-12 px-6", isClockedIn ? 'opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white')}
          onClick={handleClockIn}
          disabled={isSubmitting || isLoading || isClockedIn}
        >
          <LogIn className="w-5 h-5 mr-3" />
          Absen Masuk
        </Button>

        <Button
          variant={!isClockedIn ? 'outline' : 'default'}
          className={cn("w-full justify-start h-12 px-6", !isClockedIn ? 'opacity-50 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white')}
          onClick={handleClockOut}
          disabled={isSubmitting || isLoading || !isClockedIn}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Absen Pulang
        </Button>
      </div>
    </div>
  );
}
