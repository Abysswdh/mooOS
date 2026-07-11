'use client';

import { MemberTable } from '@/components/features/MemberTable';
import { MemberCreateModal } from '@/components/features/MemberCreateModal';

export default function AnggotaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Anggota Koperasi</h2>
          <p className="text-muted-foreground">Kelola anggota, simpanan, dan status keanggotaan.</p>
        </div>
        <MemberCreateModal />
      </div>
      <MemberTable />
    </div>
  );
}
