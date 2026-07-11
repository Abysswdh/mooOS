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
import { MemberCreateInput } from '@/types';
import { Plus } from 'lucide-react';

const memberSchema = z.object({
  nik: z.string().min(16, 'NIK harus 16 digit'),
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().optional(),
  address: z.string().optional(),
  simpanan_pokok: z.coerce.number().min(0),
  simpanan_wajib: z.coerce.number().min(0),
});

export function MemberCreateModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof memberSchema>>({
    // @ts-ignore - known type mismatch between zod coerce and hookform resolvers
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nik: '',
      name: '',
      phone: '',
      address: '',
      simpanan_pokok: 100000,
      simpanan_wajib: 50000,
    },
  });

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsSubmitting(true);
    try {
      const payload: MemberCreateInput = {
        nik: values.nik,
        name: values.name,
        phone: values.phone || null,
        address: values.address || null,
        simpanan_pokok: values.simpanan_pokok || 0,
        simpanan_wajib: values.simpanan_wajib || 0,
      };

      await apiPost('/members', payload);
      toastSuccess('Anggota berhasil ditambahkan');
      setOpen(false);
      form.reset();

      // We will need to revalidate members cache when we hook it up to SWR
      window.location.reload();
    } catch (error: any) {
      toastError(error.message || 'Gagal menambahkan anggota');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Tambah Anggota
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Anggota Baru</DialogTitle>
          <DialogDescription>
            Masukkan data anggota koperasi baru ke dalam sistem.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK *</FormLabel>
                  <FormControl>
                    <Input placeholder="16 Digit NIK" {...field} />
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
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: Budi Santoso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor HP / Telepon (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="08123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Jl. Desa Makmur No. 4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="simpanan_pokok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Simpanan Pokok (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="simpanan_wajib"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Simpanan Wajib (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
