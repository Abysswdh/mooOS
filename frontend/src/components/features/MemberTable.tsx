'use client';

import { useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Badge } from '@/components/ui/badge';
import { formatRp } from '@/lib/formatters';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { MemberDetailModal } from './MemberDetailModal';
import type { Member } from '@/types';

export function MemberTable() {
  const { members, isLoading, error, refetch } = useMembers();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const columns: ColumnDef<Member>[] = [
    { 
      header: 'Nama', 
      accessorKey: 'name', 
      className: 'font-medium text-indigo-700' 
    },
    { 
      header: 'NIK', 
      accessorKey: 'nik',
      className: 'text-slate-500' 
    },
    { 
      header: 'No. HP', 
      cell: (member) => member.phone || '-',
      className: 'text-slate-600'
    },
    { 
      header: 'Simpanan Pokok', 
      cell: (member) => formatRp(member.simpanan_pokok),
      align: 'right',
      className: 'font-medium text-slate-700'
    },
    { 
      header: 'Simpanan Wajib', 
      cell: (member) => formatRp(member.simpanan_wajib),
      align: 'right',
      className: 'font-medium text-slate-700'
    },
    { 
      header: 'Status', 
      cell: (member) => member.is_active ? (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Aktif</Badge>
      ) : (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-200">Non-Aktif</Badge>
      ),
      align: 'center'
    },
  ];

  const sortOptions: SortOption<Member>[] = [
    { label: 'Nama (A-Z)', value: 'name-asc', sortFn: (a, b) => a.name.localeCompare(b.name) },
    { label: 'Nama (Z-A)', value: 'name-desc', sortFn: (a, b) => b.name.localeCompare(a.name) },
    { label: 'Total Simpanan (Tertinggi)', value: 'simpanan-desc', sortFn: (a, b) => (b.simpanan_pokok + b.simpanan_wajib) - (a.simpanan_pokok + a.simpanan_wajib) },
    { label: 'Total Simpanan (Terendah)', value: 'simpanan-asc', sortFn: (a, b) => (a.simpanan_pokok + a.simpanan_wajib) - (b.simpanan_pokok + b.simpanan_wajib) },
  ];

  return (
    <>
      <DataTable
        data={members}
        columns={columns}
        searchPlaceholder="Cari nama atau NIK..."
        searchKeys={['name', 'nik']}
        sortOptions={sortOptions}
        defaultSortValue="name-asc"
        onRowClick={(member) => {
          setSelectedMember(member);
          setIsDetailOpen(true);
        }}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="Belum ada data anggota koperasi"
      />
      
      <MemberDetailModal 
        member={selectedMember} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onUpdated={refetch}
      />
    </>
  );
}
