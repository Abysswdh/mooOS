'use client';

import { useMembers } from '@/hooks/useMembers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRp } from '@/lib/formatters';

export function MemberTable() {
  const { members, total, isLoading, error, refetch } = useMembers();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (members.length === 0) return <EmptyState title="Belum ada data anggota koperasi" />;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>NIK</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead>Simpanan Pokok</TableHead>
            <TableHead>Simpanan Wajib</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.nik}</TableCell>
              <TableCell>
                <div>{member.phone || '-'}</div>
              </TableCell>
              <TableCell>{formatRp(member.simpanan_pokok)}</TableCell>
              <TableCell>{formatRp(member.simpanan_wajib)}</TableCell>
              <TableCell className="text-center font-bold">
                {member.is_active ? 'Aktif' : 'Non-Aktif'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 border-t text-sm text-muted-foreground">
        Menampilkan {members.length} dari {total} total anggota.
      </div>
    </div>
  );
}
