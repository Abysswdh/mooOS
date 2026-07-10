'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useAttendance } from '@/hooks/useDashboard';
import { toastSuccess, toastError } from '@/lib/notify';

export function AbsensiCard() {
  const { attendance, isClockedIn, isLoading, clockIn, clockOut, isSubmitting } = useAttendance();

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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Kehadiran Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center gap-4 py-6">
        <div className="text-center space-y-2">
          {isLoading ? (
            <>
              <p className="text-sm text-muted-foreground">Memuat status kehadiran...</p>
              <p className="text-3xl font-bold text-muted-foreground">-- : --</p>
            </>
          ) : isClockedIn ? (
            <>
              <p className="text-sm text-muted-foreground">Anda sudah absen masuk pada</p>
              <p className="text-3xl font-bold text-emerald-600">{clockInTime}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Silakan absen untuk memulai shift</p>
              <p className="text-3xl font-bold text-muted-foreground">-- : --</p>
            </>
          )}
        </div>

        <div className="w-full mt-4">
          {isClockedIn ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClockOut}
              disabled={isSubmitting || isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Absen Pulang
            </Button>
          ) : (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleClockIn}
              disabled={isSubmitting || isLoading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Absen Masuk
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
