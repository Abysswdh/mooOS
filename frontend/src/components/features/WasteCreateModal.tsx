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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/notify';
import { WasteBatchCreateInput } from '@/types';
import { Plus } from 'lucide-react';

const wasteSchema = z.object({
  barn_id: z.coerce.number().min(1, 'Kandang wajib dipilih'),
  raw_waste_kg: z.coerce.number().min(1, 'Berat limbah harus lebih dari 0'),
});

export function WasteCreateModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof wasteSchema>>({
    // @ts-ignore
    resolver: zodResolver(wasteSchema),
    defaultValues: {
      barn_id: 0,
      raw_waste_kg: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof wasteSchema>) => {
    setIsSubmitting(true);
    try {
      const payload: WasteBatchCreateInput = {
        barn_id: values.barn_id,
        raw_waste_kg: values.raw_waste_kg,
      };

      await apiPost('/waste/batches', payload);

      toastSuccess('Limbah berhasil dicatat');
      setOpen(false);
      form.reset({
        barn_id: 0,
        raw_waste_kg: 0,
      });
      
      // refresh data
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal mencatat limbah');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Catat Limbah
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Catat Pengumpulan Limbah</DialogTitle>
          <DialogDescription>
            Masukkan data limbah kotoran sapi yang dikumpulkan dari kandang.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="barn_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Kandang *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kandang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Kandang A (Abyasa)</SelectItem>
                      <SelectItem value="2">Kandang B (Axel)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="raw_waste_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Berat Limbah Mentah (kg) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
