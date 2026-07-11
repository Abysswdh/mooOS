// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cow, CowUpdateInput } from '@/types';
import { formatNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { useCowMutations } from '@/hooks/useCows';
import { useMembers } from '@/hooks/useMembers';
import { toastSuccess, toastError } from '@/lib/notify';

interface CowDetailModalProps {
  cow: Cow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function CowDetailModal({ cow, isOpen, onClose, onUpdated }: CowDetailModalProps) {
  const { sellCow, isSubmitting } = useCowMutations();
  const [isSelling, setIsSelling] = useState(false);
  const { members } = useMembers();

  if (!cow) return null;

  // The Telegram bot deep link format
  const qrValue = `https://t.me/MooOS_AdminBot?start=cow_${cow.id}`;

  const isDairyCow = cow.cow_type === 'DAIRY';
  const isActiveCow = cow.status !== 'SOLD' && cow.status !== 'DEAD';

  const handleJualSapi = async () => {
    if (!window.confirm(`Anda yakin ingin menjual sapi ${cow.code}? Aksi ini akan mengubah statusnya menjadi Terjual dan mengirimkan notifikasi ke PJ Kandang.`)) {
      return;
    }

    try {
      setIsSelling(true);
      await sellCow(cow.id);
      toastSuccess(`Sapi ${cow.code} berhasil dijual`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menjual sapi');
    } finally {
      setIsSelling(false);
    }
  };

  const owner = cow.owner_id ? members.find((m) => m.id === cow.owner_id) : null;
  const ownerDisplay = owner ? `${owner.name} (ID: #${owner.id})` : cow.owner_id ? `#${cow.owner_id}` : '-';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Sapi - {cow.code}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex justify-center mb-4 p-4 bg-white rounded-lg border">
            <QRCodeSVG value={qrValue} size={150} level="M" includeMargin={false} />
          </div>
          <div className="text-center text-xs text-muted-foreground mb-4">
            Scan QR Code ini menggunakan bot Telegram MooOS untuk melaporkan produksi susu atau limbah.
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm border p-4 rounded-md bg-muted/20">
            <div className="text-muted-foreground">Nama</div>
            <div className="font-medium">{cow.name || '-'}</div>

            <div className="text-muted-foreground">Status</div>
            <div>
              <Badge variant="outline">{cow.status}</Badge>
            </div>

            <div className="text-muted-foreground">Tipe</div>
            <div className="font-medium">{cow.cow_type === 'DAIRY' ? 'Perah' : 'Potong'}</div>

            <div className="text-muted-foreground">Gender</div>
            <div className="font-medium">{cow.gender === 'FEMALE' ? 'Betina' : 'Jantan'}</div>

            <div className="text-muted-foreground">Berat</div>
            <div className="font-medium">{formatNumber(cow.weight_kg)} kg</div>

            <div className="text-muted-foreground">Pemilik (Anggota)</div>
            <div className="font-medium">{ownerDisplay}</div>

            <div className="text-muted-foreground">Kandang</div>
            <div className="font-medium">{cow.barn_id ? `Kandang #${cow.barn_id}` : '-'}</div>
          </div>



          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="border p-3 rounded-md">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Riwayat Kesehatan</h4>
              <div className="text-sm italic text-muted-foreground text-center py-4">
                (Belum ada catatan kesehatan)
              </div>
            </div>
            
            <div className="border p-3 rounded-md">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Riwayat Susu (7 Hari)</h4>
              <div className="text-sm italic text-muted-foreground text-center py-4">
                (Belum ada catatan susu)
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {cow.status !== 'SOLD' && cow.status !== 'DEAD' && (
            <Button 
              variant="destructive" 
              onClick={handleJualSapi}
              disabled={isSubmitting || isSelling}
            >
              {isSelling ? 'Memproses...' : 'Jual Sapi'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
