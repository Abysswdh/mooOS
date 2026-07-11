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
import { CowCreateInput } from '@/types';
import { Plus } from 'lucide-react';

const cowSchema = z.object({
  code: z.string().min(1, 'Kode Sapi wajib diisi'),
  name: z.string().optional(),
  breed: z.string().optional(),
  gender: z.string().default('FEMALE'),
  cow_type: z.string().default('DAIRY'),
  weight_kg: z.coerce.number().min(0),
  birth_date: z.string().optional(),
});

export function CowCreateModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof cowSchema>>({
    // @ts-ignore - known type mismatch between zod coerce and hookform resolvers
    resolver: zodResolver(cowSchema),
    defaultValues: {
      code: '',
      name: '',
      breed: '',
      gender: 'FEMALE',
      cow_type: 'DAIRY',
      weight_kg: 0,
      birth_date: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof cowSchema>) => {
    setIsSubmitting(true);
    try {
      const payload: CowCreateInput = {
        code: values.code,
        name: values.name || null,
        breed: values.breed || null,
        gender: values.gender,
        cow_type: values.cow_type,
        weight_kg: values.weight_kg || 0,
        birth_date: values.birth_date || null,
        owner_id: null,
        barn_id: null,
      };

      await apiPost('/cows', payload);
      toastSuccess('Sapi berhasil ditambahkan');
      setOpen(false);
      form.reset();
      
      // We will need to revalidate cows cache when we hook it up to SWR
      // but for now reloading window is the easiest way to refresh the parent table
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal menambahkan sapi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Sapi
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Sapi Baru</DialogTitle>
          <DialogDescription>
            Masukkan data sapi baru ke dalam sistem. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Sapi *</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: S001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sapi (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Bessie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FEMALE">Betina</SelectItem>
                        <SelectItem value="MALE">Jantan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cow_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Sapi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAIRY">Perah</SelectItem>
                        <SelectItem value="BEEF">Pedaging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Berat (kg)</FormLabel>
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
