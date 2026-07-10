'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Beef } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiPost } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/notify';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiPost<{ access_token: string }>('/auth/login', { 
        email, 
        password 
      });

      localStorage.setItem('token', res.access_token);

      toastSuccess('Berhasil masuk ke MooOS');
      router.push('/dashboard');
    } catch (err: any) {
      toastError(err.message || 'Gagal login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <Image src="/mooos-logo.png" alt="MooOS Logo" width={280} height={80} className="h-16 w-auto object-contain" priority />
          </div>
          <CardDescription className="text-base">
            Sistem Informasi Koperasi Ternak Sapi Perah
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@koperasi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
