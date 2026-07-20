'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-xl shadow-zinc-200/50 border border-border p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
            <Store className="w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-foreground tracking-tight mb-2">Welcome Back</h1>
        <p className="text-center text-muted-foreground mb-8">Sign in to your POS account</p>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-12 h-14 bg-muted/50 border-border rounded-xl text-lg focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 h-14 bg-muted/50 border-border rounded-xl text-lg focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>


      </div>
    </div>
  );
}
