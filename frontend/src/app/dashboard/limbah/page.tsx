'use client';

import { useWaste } from '@/hooks/useWaste';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { WasteCreateModal } from '@/components/features/WasteCreateModal';
import { FertilizerOfferModal } from '@/components/features/FertilizerOfferModal';
import { KPICard } from '@/components/ui/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Recycle } from 'lucide-react';

export default function LimbahPage() {
  const { summary, batches, isLoading, error, refetch } = useWaste();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pengolahan Limbah & Pupuk</h2>
          <p className="text-muted-foreground">Pantau proses fermentasi pupuk kandang.</p>
        </div>
        <div className="flex gap-2">
          <FertilizerOfferModal />
          <WasteCreateModal />
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Limbah Mentah" value={`${formatNumber(summary.total_raw_waste_kg)} kg`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Pupuk Siap Jual" value={`${formatNumber(summary.total_fertilizer_ready_kg)} kg`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Batch Fermentasi" value={`${summary.batches_fermenting} Batch`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Batch Siap Jual" value={`${summary.batches_ready} Batch`} icon={<Recycle className="h-4 w-4" />} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Batch Pupuk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Batch</TableHead>
                <TableHead>Kandang ID</TableHead>
                <TableHead>Limbah Mentah</TableHead>
                <TableHead>Estimasi Pupuk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada data batch limbah</TableCell>
                </TableRow>
              ) : (
                batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.batch_code}</TableCell>
                    <TableCell>#{b.barn_id}</TableCell>
                    <TableCell>{formatNumber(b.raw_waste_kg)} kg</TableCell>
                    <TableCell>{formatNumber(b.estimated_fertilizer_kg)} kg</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'READY' ? 'default' : 'outline'}>{b.status}</Badge>
                    </TableCell>
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
