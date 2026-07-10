'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan Koperasi</h2>
        <p className="text-muted-foreground">Unduh laporan harian, bulanan, dan dokumen administrasi.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Harian (SHU)</CardTitle>
            <CardDescription>Ringkasan operasional dan keuangan hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => alert('Fitur generate PDF sedang dikerjakan (Fase 3)')}>
              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Laporan Bulanan</CardTitle>
            <CardDescription>Rekap produksi susu dan penggunaan pakan sebulan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Kesehatan Sapi</CardTitle>
            <CardDescription>Riwayat pengobatan dan tingkat mortalitas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
