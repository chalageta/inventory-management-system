'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowRight, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid business email'),
  password: z.string().min(6, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Invalid credentials');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           {/* Animated Gradient Background */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[120px]" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <Image
            src="/images/logo/gilando_logo.webp"
            alt="Gilando"
            width={320}
            height={120}
            className="mx-auto mb-8 drop-shadow-2xl"
            priority
          />
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Streamline your workflow.
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Experience the next generation of service management with our unified portal.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo/gilando_logo.webp" alt="Logo" width={180} height={60} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-white border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl shadow-sm"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-white border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl shadow-sm"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <button className="text-blue-600 font-bold hover:underline underline-offset-4">
              Contact Admin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}