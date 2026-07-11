'use client';

import { useFeed } from '@/hooks/useFeed';
import { usePrices } from '@/hooks/usePrices';
import { PriceHistoryChart } from '@/components/features/PriceHistoryChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { FeedOrderModal } from '@/components/features/FeedOrderModal';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { formatNumber, formatRp } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Wheat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/notify';
import type { FeedOrder } from '@/types';

export default function PakanPage() {
  const { stock, orders, isLoading, error, refetch } = useFeed();
  const { prices, isLoading: isPricesLoading } = usePrices();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const handlePay = async (id: number) => {
    try {
      await apiPost(`/feed/orders/${id}/pay`, {});
      toastSuccess('Status PO berhasil diubah menjadi DIBAYAR');
      refetch();
    } catch (e: any) {
      toastError(e.message || 'Gagal mengubah status');
    }
  };

  const handleDeliver = async (id: number) => {
    try {
      await apiPost(`/feed/orders/${id}/deliver`, {});
      toastSuccess('Barang diterima. Stok pakan bertambah!');
      refetch();
    } catch (e: any) {
      toastError(e.message || 'Gagal mengubah status');
    }
  };

  const columns: ColumnDef<FeedOrder>[] = [
    { 
      header: 'No. PO', 
      accessorKey: 'po_number', 
      className: 'font-medium text-emerald-700' 
    },
    { 
      header: 'Tipe Pakan', 
      accessorKey: 'feed_type'
    },
    { 
      header: 'Jumlah (Kg)', 
      cell: (order) => formatNumber(order.quantity_kg),
      align: 'right'
    },
    { 
      header: 'Max Harga/Kg', 
      cell: (order) => formatRp(order.max_price_per_kg),
      align: 'right'
    },
    { 
      header: 'Status', 
      cell: (order) => {
        let variant = 'outline';
        if (order.status === 'CONFIRMED' || order.status === 'PAID' || order.status === 'DELIVERED') variant = 'default';
        else if (order.status === 'REJECTED' || order.status === 'EXPIRED') variant = 'destructive';
        
        return <Badge variant={variant as any}>{order.status}</Badge>;
      },
      align: 'center'
    },
    {
      header: 'Aksi',
      cell: (order) => {
        if (order.status === 'CONFIRMED') {
          return (
            <Button size="sm" onClick={() => handlePay(order.id)}>
              Tandai Dibayar
            </Button>
          );
        }
        if (order.status === 'PAID') {
          return (
            <Button size="sm" onClick={() => handleDeliver(order.id)}>
              Barang Diterima
            </Button>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
      align: 'right'
    }
  ];

  const sortOptions: SortOption<FeedOrder>[] = [
    { label: 'Terbaru', value: 'newest', sortFn: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
    { label: 'Terlama', value: 'oldest', sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
    { label: 'Jumlah (Terbanyak)', value: 'qty-desc', sortFn: (a, b) => b.quantity_kg - a.quantity_kg },
    { label: 'Jumlah (Sedikit)', value: 'qty-asc', sortFn: (a, b) => a.quantity_kg - b.quantity_kg },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Pakan</h2>
          <p className="text-muted-foreground">Pantau stok pakan dan kelola pemesanan (PO) ke supplier.</p>
        </div>
        <FeedOrderModal />
      </div>

      {stock && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Sisa Stok Pakan" value={`${formatNumber(stock.current_stock_kg)} kg`} icon={<Wheat className="h-4 w-4" />} />
          <KPICard title="Konsumsi Harian" value={`${formatNumber(stock.daily_consumption_kg)} kg`} icon={<Wheat className="h-4 w-4" />} />
          <KPICard 
            title="Estimasi Habis" 
            value={`${formatNumber(stock.days_remaining)} Hari`} 
            trend={stock.is_critical ? { value: 0, label: 'Kritis', isPositive: false } : undefined}
            icon={<Wheat className="h-4 w-4" />} 
          />
        </div>
      )}

      {/* Tambahan Grafik Harga */}
      {!isPricesLoading && (
        <PriceHistoryChart 
          data={prices} 
          title="Histori Harga Pasar"
          description="Pergerakan harga Pakan, Susu, dan Pupuk hasil lelang Telegram."
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian (PO)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={columns}
            searchPlaceholder="Cari nomor PO..."
            searchKeys={['po_number', 'feed_type']}
            sortOptions={sortOptions}
            defaultSortValue="newest"
            emptyTitle="Belum ada riwayat PO"
          />
        </CardContent>
      </Card>
    </div>
  );
}
