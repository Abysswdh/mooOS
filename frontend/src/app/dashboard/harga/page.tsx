// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api';
import { toastSuccess, toastError, toastInfo } from '@/lib/notify';
import { TodayPricesSummary, MarketPriceInput } from '@/types';
import { Receipt, AlertCircle } from 'lucide-react';

const priceSchema = z.object({
  pakan: z.coerce.number().min(1, 'Harga pakan tidak boleh kosong'),
  susu: z.coerce.number().min(1, 'Harga susu tidak boleh kosong'),
  pupuk: z.coerce.number().min(1, 'Harga pupuk tidak boleh kosong'),
});

export default function HargaPasarPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodayPricesSummary | null>(null);

  const form = useForm<z.infer<typeof priceSchema>>({
    // @ts-ignore
    resolver: zodResolver(priceSchema),
    defaultValues: {
      pakan: 0,
      susu: 0,
      pupuk: 0,
    },
  });

  const fetchTodayPrices = async () => {
    try {
      const data = await apiGet<TodayPricesSummary>('/prices/today');
      setTodaySummary(data);
      form.reset({
        pakan: data.pakan?.price_per_unit || 0,
        susu: data.susu?.price_per_unit || 0,
        pupuk: data.pupuk?.price_per_unit || 0,
      });
    } catch (error: any) {
      toastError(error.message || 'Gagal mengambil data harga');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayPrices();
  }, []);

  const onSubmit = async (values: z.infer<typeof priceSchema>) => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const payloadPakan: MarketPriceInput = {
        date: today,
        item_type: 'PAKAN',
        price_per_unit: values.pakan,
        unit: 'kg',
        source: 'ADMIN'
      };
      
      const payloadSusu: MarketPriceInput = {
        date: today,
        item_type: 'SUSU',
        price_per_unit: values.susu,
        unit: 'liter',
        source: 'ADMIN'
      };
      
      const payloadPupuk: MarketPriceInput = {
        date: today,
        item_type: 'PUPUK',
        price_per_unit: values.pupuk,
        unit: 'kg',
        source: 'ADMIN'
      };

      // In a real app we'd Promise.all these, but sequential is fine for now
      await apiPost('/prices', payloadPakan);
      await apiPost('/prices', payloadSusu);
      await apiPost('/prices', payloadPupuk);
      
      toastSuccess('Harga hari ini berhasil disimpan');
      await fetchTodayPrices();
    } catch (error: any) {
      toastError(error.message || 'Gagal menyimpan harga');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data harga...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Harga Pasar</h2>
          <p className="text-muted-foreground">Tentukan harga komoditas untuk hari ini.</p>
        </div>
      </div>

      {todaySummary?.is_auto_generated && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Menggunakan Harga Estimasi</p>
            <p className="text-sm">Harga hari ini belum di-set. Sistem sedang menggunakan harga kemarin. Silakan update harga untuk hari ini.</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Input Harga Hari Ini
          </CardTitle>
          <CardDescription>
            Harga ini akan digunakan sebagai dasar perhitungan transaksi dan PO otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="pakan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Pakan (per kg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                          <Input type="number" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="susu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Susu (per liter)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                          <Input type="number" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pupuk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Pupuk (per kg)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                          <Input type="number" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Harga Hari Ini'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
