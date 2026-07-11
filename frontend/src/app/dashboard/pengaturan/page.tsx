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
  const [simpananPokok, setSimpananPokok] = useState(100000);
  const [simpananWajib, setSimpananWajib] = useState(50000);
  const [pjKandangId, setPjKandangId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');

  useEffect(() => {
    if (settings) {
      setNama(settings.koperasi_name);
      setAlamat(settings.address);
      setNotifWa(settings.enable_telegram_notif);
      setAutoPrice(settings.auto_price_fluctuation);
      setSimpananPokok(settings.simpanan_pokok_default);
      setSimpananWajib(settings.simpanan_wajib_per_sapi);
      setPjKandangId(settings.pj_kandang_telegram_id || '');
      setTelegramBotToken(settings.telegram_bot_token || '');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings({
        koperasi_name: nama,
        address: alamat,
        enable_telegram_notif: notifWa,
        auto_price_fluctuation: autoPrice,
        simpanan_pokok_default: simpananPokok,
        simpanan_wajib_per_sapi: simpananWajib,
        pj_kandang_telegram_id: pjKandangId || null,
        telegram_bot_token: telegramBotToken || null
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
            <div className="space-y-2">
              <Label htmlFor="pj-kandang">Telegram ID PJ Kandang</Label>
              <Input 
                id="pj-kandang" 
                placeholder="Contoh: 123456789"
                value={pjKandangId} 
                onChange={(e) => setPjKandangId(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">ID Telegram penanggung jawab kandang (digunakan saat demo untuk langsung aktif sebagai PJ).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token">Telegram Bot Token</Label>
              <Input 
                id="telegram-bot-token" 
                placeholder="Contoh: 123456789:ABCdefGHIjklmNOPqrstuVWXyz"
                value={telegramBotToken} 
                onChange={(e) => setTelegramBotToken(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">Token bot Telegram (lihat laporan untuk demo). Jika diubah, backend perlu direstart.</p>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving} variant="outline" className="w-full">
                {isSaving ? 'Menyimpan...' : 'Update Konfigurasi Bot'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pengaturan Simpanan MRP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="simpanan-pokok">Simpanan Pokok Default (Rp)</Label>
                <Input 
                  id="simpanan-pokok" 
                  type="number"
                  value={simpananPokok} 
                  onChange={(e) => setSimpananPokok(Number(e.target.value))} 
                />
                <p className="text-xs text-muted-foreground">Dibayarkan saat pendaftaran anggota baru.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="simpanan-wajib">Simpanan Wajib per Sapi (Rp)</Label>
                <Input 
                  id="simpanan-wajib" 
                  type="number"
                  value={simpananWajib} 
                  onChange={(e) => setSimpananWajib(Number(e.target.value))} 
                />
                <p className="text-xs text-muted-foreground">Ditagihkan ke anggota (atau dipotong dari SHU) untuk setiap ekor sapi aktif.</p>
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? 'Menyimpan...' : 'Simpan MRP Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
