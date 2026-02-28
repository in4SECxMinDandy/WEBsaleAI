'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl">
              <span className="text-primary-600">ML</span>
              <span className="text-foreground">Shop</span>
            </span>
          </Link>
        </div>

        {sent ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Kiểm tra email của bạn</h2>
            <p className="text-muted-foreground text-sm">
              Nếu email <strong>{getValues('email')}</strong> tồn tại trong hệ thống,
              chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả spam).
            </p>
            <Link href="/login">
              <button className="btn-primary px-6 py-2.5 text-sm mt-4">
                Quay lại đăng nhập
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={cn(
                      'input-base pl-10',
                      errors.email && 'border-destructive'
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                ) : (
                  'Gửi link đặt lại mật khẩu'
                )}
              </motion.button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại đăng nhập
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
