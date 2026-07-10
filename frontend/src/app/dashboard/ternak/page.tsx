'use client';

import { CowTable } from '@/components/features/CowTable';
import { CowCreateModal } from '@/components/features/CowCreateModal';

export default function TernakPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Ternak</h2>
          <p className="text-muted-foreground">Kelola data sapi dan status kesehatannya.</p>
        </div>
        <CowCreateModal />
      </div>
      <CowTable />
    </div>
  );
}
