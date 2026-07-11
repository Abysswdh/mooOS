// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toastSuccess, toastError } from '@/lib/notify';
import { TodayPricesSummary } from '@/types';
import { Plus, Info } from 'lucide-react';

const milkOfferSchema = z.object({
  quantity_liters: z.coerce.number().min(1, 'Kuantitas harus lebih dari 0'),
  price_per_liter: z.coerce.number().min(1, 'Harga minimal harus lebih dari 0'),
  min_order_liters: z.coerce.number().min(1, 'Minimal order harus lebih dari 0'),
  duration_minutes: z.coerce.number().min(1, 'Minimal 1 menit').max(60, 'Maksimal 60 menit'),
});

export function MilkOfferModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketMilkPrice, setMarketMilkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const form = useForm<z.infer<typeof milkOfferSchema>>({
    resolver: zodResolver(milkOfferSchema),
    defaultValues: {
      quantity_liters: 100,
      price_per_liter: 7000,
      min_order_liters: 10,
      duration_minutes: 5,
    },
  });

  // Auto-fill price from latest market data when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchMarketPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const data = await apiGet<TodayPricesSummary>('/prices/today');
        if (data.susu?.price_per_unit) {
          const bestPrice = data.susu.price_per_unit;
          setMarketMilkPrice(bestPrice);
          form.setValue('price_per_liter', bestPrice);
        }
      } catch (err) {
        // Silently fail — user can still enter price manually
        console.warn('Could not load market price for milk:', err);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchMarketPrice();
  }, [open]);

  const onSubmit = async (values: z.infer<typeof milkOfferSchema>) => {
    setIsSubmitting(true);
    try {
      await apiPost('/milk/offers', values);

      toastSuccess('Lelang Penjualan Susu berhasil dibuka di Telegram');
      setOpen(false);
      form.reset();
      setMarketMilkPrice(null);
      
      // refresh data
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal membuka lelang susu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Jual Susu (Lelang)</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Jual Susu via Lelang Telegram</DialogTitle>
          <DialogDescription>
            Buka penawaran lelang susu ke grup Buyer. Sistem akan otomatis memilih harga penawaran tertinggi.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity_liters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Susu Dijual (Liter) *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_liter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Dasar (per Liter) *</FormLabel>
                  {marketMilkPrice !== null && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Harga pasar susu terkini: <strong>Rp{marketMilkPrice.toLocaleString('id-ID')}/liter</strong>. Anda dapat mengubahnya.
                      </span>
                    </div>
                  )}
                  {isLoadingPrice && (
                    <p className="text-xs text-muted-foreground">Memuat harga pasar...</p>
                  )}
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
              name="min_order_liters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimal Pembelian (Liter) *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durasi Lelang (menit) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Membuka Lelang...' : 'Buka Lelang Sekarang'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
