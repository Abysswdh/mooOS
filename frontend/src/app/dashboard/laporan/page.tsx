'use client';

import { Card } from '@/components/ui/card';
import { useFinancialSummary, useShuDistribution } from '@/hooks/useDashboard';
import { formatNumber, formatRp } from '@/lib/formatters';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PieChart } from '@/components/ui/PieChart';
import { ExportableTable, ColumnDef } from '@/components/ui/ExportableTable';
import { AlertCircle } from 'lucide-react';
import type { ShuDistributionItem } from '@/hooks/useDashboard';

export default function LaporanPage() {
  const { data: finData, isLoading: isFinLoading } = useFinancialSummary();
  const { data: shuData, isLoading: isShuLoading } = useShuDistribution();
  
  const todayDate = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale });

  const shuColumns: ColumnDef<ShuDistributionItem>[] = [
    { header: "Nama Anggota", accessor: "member_name" },
    { header: "Jumlah Sapi (Ekor)", accessor: "total_cows", align: "center" },
    { 
      header: "SHU Diterima (Rp)", 
      accessor: "shu_amount", 
      align: "right",
      render: (val) => <span className="font-semibold text-emerald-600">{formatRp(val)}</span>
    }
  ];

  const isLoading = isFinLoading || isShuLoading;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat data laporan finansial...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan Koperasi</h2>
        <p className="text-muted-foreground">Laporan finansial menyeluruh dan pembagian Sisa Hasil Usaha (SHU).</p>
      </div>

      {/* Financial Overview Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Ringkasan Finansial</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PieChart
            title="Pendapatan"
            description="Sumber pemasukan koperasi"
            data={finData?.income || []}
            valueFormatter={formatRp}
          />
          <PieChart
            title="Pengeluaran"
            description="Alokasi biaya operasional"
            data={finData?.expenses || []}
            valueFormatter={formatRp}
          />
          <Card className="flex flex-col justify-center items-center text-center p-6 border-emerald-200 bg-emerald-50 shadow-sm">
            <h4 className="text-lg font-medium text-emerald-800 mb-2">Laba Bersih Koperasi</h4>
            <span className="text-4xl font-bold text-emerald-600">
              {formatRp(finData?.net_profit || 0)}
            </span>
            <p className="text-sm text-emerald-700 mt-4">
              Total profit setelah dikurangi seluruh biaya operasional.
            </p>
          </Card>
        </div>
      </div>

      {/* SHU Distribution Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Distribusi Sisa Hasil Usaha (SHU)</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Penjelasan Rasio Bagi Hasil (Cut)</p>
            <p>
              Dari total laba bersih yang didapat, <strong>{shuData?.ratios.koperasi_cut_percent || 30}% (Cut Koperasi)</strong> dialokasikan untuk kas koperasi, sedangkan <strong>{shuData?.ratios.member_cut_percent || 70}% (Cut Pemilik Sapi)</strong> dibagikan kepada anggota. 
              Porsi yang diterima oleh setiap anggota dihitung secara proporsional berdasarkan jumlah sapi aktif yang mereka titipkan. Semakin banyak sapi, semakin besar SHU yang diperoleh.
            </p>
          </div>
        </div>

        <ExportableTable
          title={`Laporan Pembagian SHU`}
          description={`Periode: ${todayDate}`}
          columns={shuColumns}
          data={shuData?.distribution || []}
          exportFileName={`Laporan_SHU_${format(new Date(), "yyyy-MM-dd")}.pdf`}
        />
      </div>
    </div>
  );
}

