'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function PengaturanPage() {
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
              <Input id="nama" defaultValue="KUD Sapi Perah Sejahtera" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input id="alamat" defaultValue="Jl. Peternakan No. 1, Lembang" />
            </div>
            <Button>Simpan Perubahan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Notifikasi & Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-wa">Aktifkan Notifikasi Telegram</Label>
              <Switch id="notif-wa" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-price">Auto-Fluktuasi Harga (Jika Lupa)</Label>
              <Switch id="auto-price" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
