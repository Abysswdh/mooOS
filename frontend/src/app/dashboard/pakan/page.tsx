'use client';

import { useFeed } from '@/hooks/useFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber, formatRp } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

export default function PakanPage() {
  const { stock, orders, isLoading, error, refetch } = useFeed();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Pakan</h2>
          <p className="text-muted-foreground">Kelola stok pakan dan pembelian.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Beli Pakan
        </Button>
      </div>

      {stock && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Sisa Stok Pakan" value={`${formatNumber(stock.current_stock_kg)} kg`} icon="Wheat" />
          <KPICard title="Konsumsi Harian" value={`${formatNumber(stock.daily_consumption_kg)} kg`} icon="Wheat" />
          <KPICard 
            title="Estimasi Habis" 
            value={`${formatNumber(stock.days_remaining)} Hari`} 
            trend={stock.is_critical ? { value: 0, label: 'Kritis', isPositive: false } : undefined}
            icon="Wheat" 
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian (PO)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PO</TableHead>
                <TableHead>Tipe Pakan</TableHead>
                <TableHead>Jumlah (Kg)</TableHead>
                <TableHead>Max Harga/Kg</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada riwayat PO</TableCell>
                </TableRow>
              ) : (
                orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.feed_type}</TableCell>
                    <TableCell>{formatNumber(po.quantity_kg)}</TableCell>
                    <TableCell>{formatRp(po.max_price_per_kg)}</TableCell>
                    <TableCell>
                      <Badge variant={po.status === 'ACCEPTED' ? 'default' : 'outline'}>{po.status}</Badge>
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
