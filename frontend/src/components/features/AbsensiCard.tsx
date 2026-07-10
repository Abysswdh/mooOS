'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut } from 'lucide-react';

export function AbsensiCard() {
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  const handleClockIn = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setHasClockedIn(true);
      setClockInTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      setIsSubmitting(false);
    }, 1000);
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setHasClockedIn(false);
      setClockInTime(null);
      setIsSubmitting(false);
    }, 1000);
  };

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
          {hasClockedIn ? (
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
          {hasClockedIn ? (
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleClockOut}
              disabled={isSubmitting}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Absen Pulang
            </Button>
          ) : (
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleClockIn}
              disabled={isSubmitting}
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
