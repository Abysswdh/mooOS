'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';
import { toastSuccess, toastError } from '@/lib/notify';

export default function PengaturanPage() {
  const { settings, isLoading, isSaving, saveSettings } = useSettings();
  
  // Local state for the form
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [notifWa, setNotifWa] = useState(false);
  const [autoPrice, setAutoPrice] = useState(false);

  useEffect(() => {
    if (settings) {
      setNama(settings.koperasi_name);
      setAlamat(settings.address);
      setNotifWa(settings.enable_telegram_notif);
      setAutoPrice(settings.auto_price_fluctuation);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings({
        koperasi_name: nama,
        address: alamat,
        enable_telegram_notif: notifWa,
        auto_price_fluctuation: autoPrice
      });
      toastSuccess('Pengaturan berhasil disimpan');
    } catch (error: any) {
      toastError(error.message || 'Gagal menyimpan pengaturan');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat pengaturan...</div>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-muted-foreground">Konfigurasi koperasi dan parameter aplikasi.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil Koperasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Koperasi</Label>
              <Input 
                id="nama" 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input 
                id="alamat" 
                value={alamat} 
                onChange={(e) => setAlamat(e.target.value)} 
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Notifikasi & Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-wa">Aktifkan Notifikasi Telegram</Label>
              <Switch 
                id="notif-wa" 
                checked={notifWa} 
                onCheckedChange={setNotifWa} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-price">Auto-Fluktuasi Harga (Jika Lupa)</Label>
              <Switch 
                id="auto-price" 
                checked={autoPrice} 
                onCheckedChange={setAutoPrice} 
              />
            </div>
            <div className="pt-4">
               <Button onClick={handleSave} disabled={isSaving} variant="outline" className="w-full">
                {isSaving ? 'Menyimpan...' : 'Update Konfigurasi Bot'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
