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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost, apiGet } from '@/lib/api';
import { toastSuccess, toastError, toastInfo } from '@/lib/notify';
import { FeedOrderCreateInput } from '@/types';
import { Plus } from 'lucide-react';

const feedOrderSchema = z.object({
  quantity_kg: z.coerce.number().min(1, 'Kuantitas harus lebih dari 0'),
  feed_type: z.string().min(1, 'Jenis pakan wajib dipilih'),
  max_price_per_kg: z.coerce.number().min(1, 'Harga maksimal harus lebih dari 0'),
});

export function FeedOrderModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierName, setSupplierName] = useState('-');
  const [supplierTelegramId, setSupplierTelegramId] = useState('');

  const form = useForm<z.infer<typeof feedOrderSchema>>({
    resolver: zodResolver(feedOrderSchema),
    defaultValues: {
      quantity_kg: 500,
      feed_type: 'Konsentrat',
      max_price_per_kg: 0,
    },
  });

  const fetchBestPrice = async () => {
    try {
      const data = await apiGet('/prices/today');
      if (data && data.pakan && data.pakan.price_per_unit) {
        form.setValue('max_price_per_kg', data.pakan.price_per_unit);
        setSupplierName(data.pakan.supplier_name || 'Tidak diketahui');
        setSupplierTelegramId(data.pakan.supplier_telegram_id || '');
      } else {
        toastInfo('Belum ada harga pasar pakan hari ini.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBestPrice();
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof feedOrderSchema>) => {
    if (!supplierTelegramId) {
      toastError('Tidak dapat membuat PO: Tidak ada supplier dari Harga Pasar hari ini.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: FeedOrderCreateInput = {
        quantity_kg: values.quantity_kg,
        feed_type: values.feed_type,
        max_price_per_kg: values.max_price_per_kg,
        supplier_telegram_id: supplierTelegramId,
      };

      await apiPost('/feed/orders', payload);

      toastSuccess('PO Pakan berhasil dikirim ke supplier via Telegram');
      setOpen(false);
      form.reset({
        quantity_kg: 500,
        feed_type: 'Konsentrat',
        max_price_per_kg: 0,
      });
      
      // refresh data
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal mengirim PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Beli Pakan
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat PO Pembelian Pakan</DialogTitle>
          <DialogDescription>
            Sistem otomatis menggunakan harga Pakan termurah yang tersimpan di Harga Pasar hari ini. PO akan dikirimkan langsung ke supplier terkait.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2 mb-4">
              <FormLabel>Supplier Termurah</FormLabel>
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-md border border-emerald-200 text-sm font-medium">
                {supplierName}
              </div>
            </div>

            <FormField
              control={form.control}
              name="feed_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Pakan *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Pakan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Konsentrat">Konsentrat</SelectItem>
                      <SelectItem value="Hijauan">Hijauan / Rumput</SelectItem>
                      <SelectItem value="Tetes Tebu">Tetes Tebu</SelectItem>
                      <SelectItem value="Suplemen">Suplemen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kuantitas Pembelian (kg) *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_price_per_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga (per kg) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                      <Input type="number" className="pl-9 bg-muted" readOnly {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              Total Tagihan: <strong>Rp {((form.watch('quantity_kg') || 0) * (form.watch('max_price_per_kg') || 0)).toLocaleString('id-ID')}</strong>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !supplierTelegramId}>
              {isSubmitting ? 'Mengirim PO...' : 'Kirim PO ke Supplier'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
