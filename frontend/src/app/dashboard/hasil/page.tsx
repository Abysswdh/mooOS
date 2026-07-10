'use client';

import { useMilk } from '@/hooks/useMilk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/formatters';

export default function HasilSusuPage() {
  const { summary, records, isLoading, error, refetch } = useMilk();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hasil Susu</h2>
          <p className="text-muted-foreground">Pantau produksi susu harian dari semua kandang.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Catat Susu
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Produksi Hari Ini" value={`${formatNumber(summary.today_total_liters)} L`} icon="Milk" />
          <KPICard title="Produksi Kemarin" value={`${formatNumber(summary.yesterday_total_liters)} L`} icon="Milk" />
          <KPICard title="Total Minggu Ini" value={`${formatNumber(summary.week_total_liters)} L`} icon="Milk" />
          <KPICard title="Sapi Laktasi" value={`${summary.active_dairy_cows} Ekor`} icon="Beef" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>ID Sapi</TableHead>
                <TableHead>Liters</TableHead>
                <TableHead>Dicatat Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada riwayat produksi susu</TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-medium">Sapi #{r.cow_id}</TableCell>
                    <TableCell>{formatNumber(r.liters)}</TableCell>
                    <TableCell>{r.recorded_by || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
