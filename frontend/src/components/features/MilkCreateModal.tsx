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
import { apiGet, apiPost } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/notify';
import { Cow, ListResponse } from '@/types';
import { Plus } from 'lucide-react';

const milkSchema = z.object({
  cow_id: z.coerce.number().min(1, 'Sapi wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  liters: z.coerce.number().min(0.1, 'Volume susu harus lebih dari 0'),
});

export function MilkCreateModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cows, setCows] = useState<Cow[]>([]);
  const [isLoadingCows, setIsLoadingCows] = useState(false);

  const form = useForm<z.infer<typeof milkSchema>>({
    // @ts-ignore
    resolver: zodResolver(milkSchema),
    defaultValues: {
      cow_id: 0,
      date: new Date().toISOString().split('T')[0], // today YYYY-MM-DD
      liters: 0,
    },
  });

  useEffect(() => {
    if (open) {
      const fetchCows = async () => {
        setIsLoadingCows(true);
        try {
          // In a real app we'd use useCows() SWR hook.
          const res = await apiGet<ListResponse<Cow>>('/cows');
          setCows(res.items.filter(c => c.cow_type === 'DAIRY' && c.status !== 'DEAD' && c.status !== 'SOLD'));
        } catch (error) {
          toastError('Gagal memuat data sapi');
        } finally {
          setIsLoadingCows(false);
        }
      };
      fetchCows();
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof milkSchema>) => {
    setIsSubmitting(true);
    try {
      await apiPost('/milk/records', {
        cow_id: values.cow_id,
        date: values.date,
        liters: values.liters,
      });

      toastSuccess('Hasil susu berhasil dicatat');
      setOpen(false);
      form.reset({
        ...form.getValues(),
        cow_id: 0,
        liters: 0,
      });
      
      // refresh data
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal mencatat susu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Catat Susu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Catat Hasil Susu Harian</DialogTitle>
          <DialogDescription>
            Pilih sapi perah dan masukkan volume susu yang dihasilkan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cow_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Sapi *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value ? field.value.toString() : ""}
                    disabled={isLoadingCows}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCows ? "Memuat..." : "Pilih Sapi Perah"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cows.map((cow) => (
                        <SelectItem key={cow.id} value={cow.id.toString()}>
                          {cow.code} {cow.name ? `- ${cow.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Perah *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="liters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume (Liter) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingCows}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
