'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Share2, Printer } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { formatNumber, formatRp } from '@/lib/formatters';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function LaporanPage() {
  const { summary, isLoading } = useDashboard();
  
  const todayDate = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!summary) return;
    
    const text = `*LAPORAN HARIAN MooOS* 🐄\n` +
      `Tanggal: ${todayDate}\n\n` +
      `*Produksi & Stok*\n` +
      `- Total Sapi Aktif: ${summary.active_cows} ekor\n` +
      `- Susu Hari Ini: ${summary.today_milk_liters} Liter\n` +
      `- Sisa Pakan: ${summary.feed_stock_kg} Kg\n\n` +
      `*Finansial*\n` +
      `- Pendapatan Kotor: ${formatRp(summary.today_revenue)}\n\n` +
      `_Di-generate otomatis oleh Sistem Pintar MooOS_`;
      
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">Laporan Koperasi</h2>
        <p className="text-muted-foreground">Unduh laporan harian, bulanan, dan dokumen administrasi.</p>
      </div>

      {/* Screen View Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Laporan Harian (SHU)</CardTitle>
            <CardDescription>Ringkasan operasional dan keuangan hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button className="w-full" onClick={handlePrint} disabled={isLoading}>
              <Printer className="mr-2 h-4 w-4" /> Cetak / Simpan PDF
            </Button>
            <Button variant="outline" className="w-full text-green-600 border-green-600 hover:bg-green-50" onClick={handleWhatsAppShare} disabled={isLoading}>
              <Share2 className="mr-2 h-4 w-4" /> Bagikan ke WhatsApp
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Laporan Bulanan</CardTitle>
            <CardDescription>Rekap produksi susu dan penggunaan pakan sebulan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Kesehatan Sapi</CardTitle>
            <CardDescription>Riwayat pengobatan dan tingkat mortalitas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Printable Report View (Hidden on screen, shown only when printing) */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 print:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">MooOS</h1>
            <p className="text-gray-500">Koperasi Peternak Sapi Perah</p>
            <h2 className="text-xl font-semibold mt-4">LAPORAN HARIAN (SHU)</h2>
            <p className="text-sm text-gray-500">{todayDate}</p>
          </div>

          {!isLoading && summary ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">1. Ringkasan Produksi</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-2">Total Sapi Aktif</td><td className="py-2 text-right font-medium">{formatNumber(summary.active_cows)} Ekor</td></tr>
                    <tr className="border-b"><td className="py-2">Total Produksi Susu Hari Ini</td><td className="py-2 text-right font-medium">{formatNumber(summary.today_milk_liters)} Liter</td></tr>
                    <tr className="border-b"><td className="py-2">Sisa Stok Pakan</td><td className="py-2 text-right font-medium">{formatNumber(summary.feed_stock_kg)} Kg</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">2. Estimasi Finansial</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-2">Pendapatan Susu & Pupuk (Kotor)</td><td className="py-2 text-right font-bold text-emerald-600">{formatRp(summary.today_revenue)}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-16 flex justify-between text-center text-sm">
                <div>
                  <p className="mb-16">Dibuat oleh,</p>
                  <p className="font-semibold underline">Sistem Pintar MooOS</p>
                  <p className="text-gray-500">Generate Otomatis</p>
                </div>
                <div>
                  <p className="mb-16">Mengetahui,</p>
                  <p className="font-semibold underline">Ketua Koperasi</p>
                </div>
              </div>
            </div>
          ) : (
            <p>Memuat data laporan...</p>
          )}
        </div>
      </div>
    </div>
  );
}
