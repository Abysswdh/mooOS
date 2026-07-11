import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Info, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';

export default function TentangPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tentang Sistem</h2>
        <p className="text-muted-foreground mt-1">
          Informasi mengenai sistem aplikasi MooOS.
        </p>
      </div>

      <Card className="border-t-4 border-t-emerald-500 shadow-md">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="flex justify-center mb-6">
            <Image 
              src="/mooos-logo.png" 
              alt="MooOS Logo" 
              width={300} 
              height={100} 
              className="h-20 w-auto object-contain" 
              style={{ width: 'auto', height: 'auto' }}
              priority 
            />
          </div>
          <CardTitle className="text-2xl font-bold">MooOS (Sistem Informasi Koperasi Ternak Sapi Perah)</CardTitle>
          <CardDescription className="text-base mt-2 max-w-2xl mx-auto">
            MooOS adalah platform digital terpadu yang dirancang khusus untuk memodernisasi dan mempermudah operasional koperasi peternak sapi perah. Sistem ini membantu mengelola siklus peternakan dari hulu ke hilir dengan efisien dan transparan.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8 pb-12">
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-800">Fitur Utama MooOS</h3>
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
              <div className="flex gap-4">
                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Manajemen Produksi Real-time</h4>
                  <p className="text-sm text-slate-500 mt-1">Pencatatan hasil perah susu dan pengolahan limbah secara instan setiap harinya untuk akurasi data maksimal.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Pemantauan Kesehatan Ternak</h4>
                  <p className="text-sm text-slate-500 mt-1">Memantau status keaktifan, laktasi, dan riwayat kesehatan sapi agar ternak selalu dalam kondisi prima.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                  <Info className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Pelaporan Otomatis</h4>
                  <p className="text-sm text-slate-500 mt-1">Sistem pintar yang mampu mengkalkulasi SHU harian dan membuat format pelaporan yang siap dicetak maupun dibagikan.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                  <HeartHandshake className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Transparansi Harga & Anggota</h4>
                  <p className="text-sm text-slate-500 mt-1">Update harga pasar (susu, pakan, pupuk) serta pencatatan distribusi untuk setiap anggota koperasi yang tergabung.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border text-center">
            <p className="text-sm text-slate-500">
              Versi Sistem: <span className="font-semibold text-slate-700">v1.0.0</span><br />
              Dibuat untuk mendukung ketahanan pangan dan kesejahteraan peternak sapi perah Indonesia.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
