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
import { toastSuccess, toastError } from '@/lib/notify';
import { apiPost } from '@/lib/api';
import { Milk, ChevronDown, ChevronUp } from 'lucide-react';

interface CowDetailModalProps {
  cow: Cow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function CowDetailModal({ cow, isOpen, onClose, onUpdated }: CowDetailModalProps) {
  const { sellCow, isSubmitting } = useCowMutations();
  const [isSelling, setIsSelling] = useState(false);

  // Milk recording state
  const [showMilkForm, setShowMilkForm] = useState(false);
  const [milkDate, setMilkDate] = useState(new Date().toISOString().split('T')[0]);
  const [milkLiters, setMilkLiters] = useState('');
  const [isSavingMilk, setIsSavingMilk] = useState(false);

  // Reset milk form when cow changes
  useEffect(() => {
    setShowMilkForm(false);
    setMilkLiters('');
    setMilkDate(new Date().toISOString().split('T')[0]);
  }, [cow?.id]);

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

  const handleSaveMilk = async () => {
    const liters = parseFloat(milkLiters);
    if (!milkLiters || isNaN(liters) || liters <= 0) {
      toastError('Masukkan volume susu yang valid (> 0)');
      return;
    }
    if (!milkDate) {
      toastError('Tanggal perah wajib diisi');
      return;
    }

    setIsSavingMilk(true);
    try {
      await apiPost('/milk/records', {
        cow_id: cow.id,
        date: milkDate,
        liters,
      });
      toastSuccess(`✅ Berhasil mencatat ${liters}L susu untuk sapi ${cow.code}`);
      setMilkLiters('');
      setShowMilkForm(false);
      onUpdated();
    } catch (err: any) {
      toastError(err.message || 'Gagal mencatat susu');
    } finally {
      setIsSavingMilk(false);
    }
  };

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
            <div className="font-medium">{cow.owner_id ? `#${cow.owner_id}` : '-'}</div>

            <div className="text-muted-foreground">Kandang</div>
            <div className="font-medium">{cow.barn_id ? `Kandang #${cow.barn_id}` : '-'}</div>
          </div>

          {/* ── Milk Recording Section (DAIRY cows only) ── */}
          {isDairyCow && isActiveCow && (
            <div className="border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMilkForm((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-800"
              >
                <span className="flex items-center gap-2">
                  <Milk className="h-4 w-4" />
                  Catat Produksi Susu
                </span>
                {showMilkForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showMilkForm && (
                <div className="p-4 space-y-3 bg-white border-t">
                  <div className="space-y-1">
                    <Label htmlFor="milk-date" className="text-xs">Tanggal Perah</Label>
                    <Input
                      id="milk-date"
                      type="date"
                      value={milkDate}
                      onChange={(e) => setMilkDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="milk-liters" className="text-xs">Volume (Liter)</Label>
                    <Input
                      id="milk-liters"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Contoh: 12.5"
                      value={milkLiters}
                      onChange={(e) => setMilkLiters(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button
                    onClick={handleSaveMilk}
                    disabled={isSavingMilk}
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSavingMilk ? 'Menyimpan...' : 'Simpan Produksi Susu'}
                  </Button>
                </div>
              )}
            </div>
          )}

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
