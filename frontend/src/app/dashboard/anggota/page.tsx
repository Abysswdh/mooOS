'use client';

import { MemberTable } from '@/components/features/MemberTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AnggotaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Anggota</h2>
          <p className="text-muted-foreground">Kelola anggota koperasi, simpanan, dan peternak.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Tambah Anggota
        </Button>
      </div>
      <MemberTable />
    </div>
  );
}
