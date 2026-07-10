'use client';

import { useCows } from '@/hooks/useCows';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/formatters';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    HEALTHY: { label: 'Sehat', className: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
    SICK: { label: 'Sakit', className: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
    DEAD: { label: 'Mati', className: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20' },
    SOLD: { label: 'Terjual', className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
    LOOKING_FOR_CARETAKER: { label: 'Butuh PJ', className: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
  };

  const config = map[status] || { label: status, className: '' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function CowTable() {
  const { cows, total, isLoading, error, refetch } = useCows();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (cows.length === 0) return <EmptyState title="Belum ada data sapi" />;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>ID Pemilik</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipe & Gender</TableHead>
            <TableHead className="text-right">Berat (Kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cows.map((cow) => (
            <TableRow key={cow.id}>
              <TableCell className="font-medium">{cow.code}</TableCell>
              <TableCell>{cow.name || '-'}</TableCell>
              <TableCell>{cow.owner_id ? `#${cow.owner_id}` : '-'}</TableCell>
              <TableCell>
                <StatusBadge status={cow.status} />
              </TableCell>
              <TableCell>
                {cow.cow_type === 'DAIRY' ? 'Perah' : 'Potong'} • {cow.gender === 'FEMALE' ? 'Betina' : 'Jantan'}
              </TableCell>
              <TableCell className="text-right">{formatNumber(cow.weight_kg)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 border-t text-sm text-muted-foreground">
        Menampilkan {cows.length} dari {total} total sapi.
      </div>
    </div>
  );
}
