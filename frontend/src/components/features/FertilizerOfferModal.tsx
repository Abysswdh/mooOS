// @ts-nocheck
'use client';

import { useState } from 'react';
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
import { apiPost } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/notify';
import { Plus } from 'lucide-react';

const fertOfferSchema = z.object({
  quantity_kg: z.coerce.number().min(1, 'Kuantitas harus lebih dari 0'),
  price_per_kg: z.coerce.number().min(1, 'Harga minimal harus lebih dari 0'),
  duration_minutes: z.coerce.number().min(1, 'Minimal 1 menit').max(60, 'Maksimal 60 menit'),
});

export function FertilizerOfferModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof fertOfferSchema>>({
    resolver: zodResolver(fertOfferSchema),
    defaultValues: {
      quantity_kg: 50,
      price_per_kg: 1500,
      duration_minutes: 5,
    },
  });

  const onSubmit = async (values: z.infer<typeof fertOfferSchema>) => {
    setIsSubmitting(true);
    try {
      await apiPost('/fertilizer/offers', values);

      toastSuccess('Lelang Penjualan Pupuk berhasil dibuka di Telegram');
      setOpen(false);
      form.reset();
      
      // refresh data
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal membuka lelang pupuk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Jual Pupuk (Lelang)</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Jual Pupuk via Lelang Telegram</DialogTitle>
          <DialogDescription>
            Buka penawaran lelang pupuk kompos ke grup Buyer. Sistem akan otomatis memilih harga penawaran tertinggi.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Pupuk Dijual (Kg) *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Dasar (per Kg) *</FormLabel>
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
