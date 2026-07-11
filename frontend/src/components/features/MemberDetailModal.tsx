'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Member } from '@/types';
import { formatRp } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function MemberDetailModal({ member, isOpen, onClose, onUpdated }: MemberDetailModalProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detail Anggota - {member.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-y-3 text-sm border p-5 rounded-lg bg-slate-50/50">
            <div className="text-slate-500">Nama Lengkap</div>
            <div className="font-semibold text-slate-900">{member.name}</div>

            <div className="text-slate-500">NIK</div>
            <div className="font-medium text-slate-700">{member.nik}</div>

            <div className="text-slate-500">Status</div>
            <div>
              {member.is_active ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Aktif</Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Non-Aktif</Badge>
              )}
            </div>

            <div className="text-slate-500">Nomor Telepon</div>
            <div className="font-medium text-slate-700">{member.phone || '-'}</div>

            <div className="text-slate-500">Alamat</div>
            <div className="font-medium text-slate-700 col-span-2 mt-1 bg-white p-2 rounded border border-slate-100">{member.address || '-'}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="border p-4 rounded-lg bg-indigo-50/30 border-indigo-100 flex flex-col items-center justify-center">
              <h4 className="text-xs font-semibold text-indigo-600/80 mb-1">Simpanan Pokok</h4>
              <div className="text-lg font-bold text-indigo-900">
                {formatRp(member.simpanan_pokok)}
              </div>
            </div>
            
            <div className="border p-4 rounded-lg bg-indigo-50/30 border-indigo-100 flex flex-col items-center justify-center">
              <h4 className="text-xs font-semibold text-indigo-600/80 mb-1">Simpanan Wajib</h4>
              <div className="text-lg font-bold text-indigo-900">
                {formatRp(member.simpanan_wajib)}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-100 p-3 rounded-lg text-center mt-2">
            <p className="text-sm font-semibold text-slate-700">Total Simpanan: <span className="text-indigo-600">{formatRp(member.simpanan_pokok + member.simpanan_wajib)}</span></p>
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => {
              // TODO: Implement Edit Modal
              alert('Fitur edit anggota akan datang!');
            }}
          >
            Edit Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
