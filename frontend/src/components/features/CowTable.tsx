'use client';

import { useState } from 'react';
import { useCows } from '@/hooks/useCows';
import { useMembers } from '@/hooks/useMembers';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/formatters';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { CowDetailModal } from './CowDetailModal';
import type { Cow } from '@/types';

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
  const { cows, isLoading: isCowsLoading, error: cowsError, refetch: refetchCows } = useCows();
  const { members, isLoading: isMembersLoading, error: membersError, refetch: refetchMembers } = useMembers();
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const columns: ColumnDef<Cow>[] = [
    { 
      header: 'Kode', 
      accessorKey: 'code', 
      className: 'font-medium text-emerald-700' 
    },
    { 
      header: 'Nama', 
      cell: (cow) => cow.name || '-',
      className: 'font-medium' 
    },
    { 
      header: 'Pemilik (Anggota)', 
      cell: (cow) => {
        if (!cow.owner_id) return '-';
        const owner = members.find((m) => m.id === cow.owner_id);
        return owner ? owner.name : `#${cow.owner_id}`;
      },
      className: 'text-slate-500' 
    },
    { 
      header: 'Status', 
      cell: (cow) => <StatusBadge status={cow.status} /> 
    },
    { 
      header: 'Tipe & Gender', 
      cell: (cow) => `${cow.cow_type === 'DAIRY' ? 'Perah' : 'Potong'} • ${cow.gender === 'FEMALE' ? 'Betina' : 'Jantan'}`,
      className: 'text-slate-600'
    },
    { 
      header: 'Berat (Kg)', 
      cell: (cow) => formatNumber(cow.weight_kg),
      align: 'right',
      className: 'font-medium text-slate-700'
    },
  ];

  const sortOptions: SortOption<Cow>[] = [
    { label: 'Kode (A-Z)', value: 'code-asc', sortFn: (a, b) => a.code.localeCompare(b.code) },
    { label: 'Kode (Z-A)', value: 'code-desc', sortFn: (a, b) => b.code.localeCompare(a.code) },
    { label: 'Berat (Terbesar)', value: 'weight-desc', sortFn: (a, b) => b.weight_kg - a.weight_kg },
    { label: 'Berat (Terkecil)', value: 'weight-asc', sortFn: (a, b) => a.weight_kg - b.weight_kg },
  ];

  return (
    <>
      <DataTable
        data={cows}
        columns={columns}
        searchPlaceholder="Cari kode atau nama sapi..."
        searchKeys={['code', 'name']}
        sortOptions={sortOptions}
        defaultSortValue="code-asc"
        onRowClick={(cow) => {
          setSelectedCow(cow);
          setIsDetailOpen(true);
        }}
        isLoading={isCowsLoading || isMembersLoading}
        error={cowsError || membersError}
        onRetry={() => {
          refetchCows();
          refetchMembers();
        }}
        emptyTitle="Belum ada data sapi"
      />
      
      <CowDetailModal 
        cow={selectedCow} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onUpdated={refetchCows}
      />
    </>
  );
}
