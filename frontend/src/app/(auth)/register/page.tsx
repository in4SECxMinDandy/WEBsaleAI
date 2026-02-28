'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sparkles, Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const passwordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Đăng ký thành công!', `Chào mừng ${user.fullName || user.email} đến với MLShop!`);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error('Đăng ký thất bại', msg || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = passwordStrength(pwValue);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-accent-600 via-primary-700 to-primary-600 items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${40 + Math.random() * 100}px`,
                height: `${40 + Math.random() * 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white px-12 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-3xl font-bold mb-3">Tham gia MLShop</h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Tạo tài khoản miễn phí và khám phá hàng nghìn sản phẩm được AI gợi ý riêng cho bạn.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
            {[
              { icon: CheckCircle, text: 'Gợi ý sản phẩm cá nhân hóa bởi AI' },
              { icon: CheckCircle, text: 'Theo dõi đơn hàng realtime' },
              { icon: CheckCircle, text: 'Ưu đãi độc quyền cho thành viên' },
              { icon: CheckCircle, text: 'Lưu danh sách yêu thích' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-white/80">
                <item.icon className="w-4 h-4 text-green-300 flex-shrink-0" />
                {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6 py-8"
        >
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-2xl">
                <span className="text-primary-600">ML</span>
                <span className="text-foreground">Shop</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Tạo tài khoản</h1>
            <p className="text-muted-foreground mt-1">Điền thông tin để đăng ký</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  className={cn('input-base pl-10', errors.fullName && 'border-destructive')}
                />
              </div>
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={cn('input-base pl-10', errors.email && 'border-destructive')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Số điện thoại <span className="text-muted-foreground font-normal">(tùy chọn)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="0901234567"
                  autoComplete="tel"
                  className={cn('input-base pl-10', errors.phone && 'border-destructive')}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('password', {
                    onChange: (e) => setPwValue(e.target.value),
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  className={cn('input-base pl-10 pr-10', errors.password && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {pwValue && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i < strength ? strengthColors[strength - 1] : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Độ mạnh: <span className="font-medium">{strengthLabels[strength - 1] || 'Rất yếu'}</span>
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className={cn('input-base pl-10 pr-10', errors.confirmPassword && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <Link href="/terms" className="text-primary-600 hover:underline">Điều khoản sử dụng</Link>
              {' '}và{' '}
              <Link href="/privacy" className="text-primary-600 hover:underline">Chính sách bảo mật</Link>
              {' '}của chúng tôi.
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo tài khoản...</>
              ) : (
                <>Tạo tài khoản <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
