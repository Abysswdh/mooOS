'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cow, CowUpdateInput } from '@/types';
import { formatNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { useCowMutations } from '@/hooks/useCows';
import { toastSuccess, toastError } from '@/lib/notify';

interface CowDetailModalProps {
  cow: Cow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function CowDetailModal({ cow, isOpen, onClose, onUpdated }: CowDetailModalProps) {
  const { updateCow, isSubmitting } = useCowMutations();
  const [isSelling, setIsSelling] = useState(false);

  if (!cow) return null;

  // The Telegram bot deep link format
  const qrValue = `https://t.me/mooos_bot?start=cow_${cow.id}`;

  const handleJualSapi = async () => {
    if (!window.confirm(`Anda yakin ingin menjual sapi ${cow.code}? Aksi ini akan mengubah statusnya menjadi Terjual dan mengarsipkan datanya.`)) {
      return;
    }

    try {
      setIsSelling(true);
      const updateData: CowUpdateInput = { status: 'SOLD' };
      await updateCow(cow.id, updateData);
      toastSuccess(`Sapi ${cow.code} berhasil dijual`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menjual sapi');
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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

          <div className="grid grid-cols-2 gap-y-2 text-sm">
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
            <div className="font-medium">{cow.owner_id ? `#${cow.owner_id}` : '-'}</div>

            <div className="text-muted-foreground">Kandang</div>
            <div className="font-medium">{cow.barn_id ? `Kandang #${cow.barn_id}` : '-'}</div>
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
