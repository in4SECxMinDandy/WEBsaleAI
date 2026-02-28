'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, Phone, Camera, Save, LogOut, Package,
  Heart, Bell, Shield, ChevronRight, Loader2,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const menuItems = [
  { icon: Package, label: 'Đơn hàng của tôi', href: '/orders', desc: 'Xem lịch sử đơn hàng' },
  { icon: Heart, label: 'Danh sách yêu thích', href: '/wishlist', desc: 'Sản phẩm đã lưu' },
  { icon: Bell, label: 'Thông báo', href: '/notifications', desc: 'Cài đặt thông báo' },
  { icon: Shield, label: 'Bảo mật', href: '/security', desc: 'Mật khẩu & xác thực' },
];

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, updateUser, clearAuth } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: '',
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="section-container py-20 text-center">
        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">Đăng nhập để quản lý tài khoản của bạn</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">Đăng nhập</Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.updateMe(data);
      updateUser(res.data.data);
      toast.success('Cập nhật thành công!', 'Thông tin tài khoản đã được lưu');
    } catch {
      toast.error('Cập nhật thất bại', 'Vui lòng thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.info('Đã đăng xuất', 'Hẹn gặp lại bạn!');
    router.push('/');
  };

  const initials = user.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(-2).join('').toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="section-container py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản của tôi</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left sidebar */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.fullName || ''} className="w-full h-full rounded-full object-cover" />
                ) : initials}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-bold text-lg">{user.fullName || 'Người dùng'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.role !== 'customer' && (
              <span className="inline-block mt-2 badge-primary text-xs px-2.5 py-1 capitalize">
                {user.role}
              </span>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors',
                  i < menuItems.length - 1 && 'border-b border-border/50'
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border border-border/50 hover:bg-destructive/5 hover:border-destructive/20 text-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>

        {/* Right content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit profile */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h2 className="font-bold text-lg mb-5">Thông tin cá nhân</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      {...register('fullName')}
                      className={cn('input-base pl-9', errors.fullName && 'border-destructive')}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={user.email}
                      disabled
                      className="input-base pl-9 opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      {...register('phone')}
                      className="input-base pl-9"
                      placeholder="0901234567"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> Lưu thay đổi</>
                )}
              </motion.button>
            </form>
          </div>

          {/* Admin link */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Link href="/admin">
              <motion.div
                className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-5 text-white cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">Admin Dashboard</p>
                    <p className="text-sm text-white/80 mt-0.5">Quản lý sản phẩm, đơn hàng và AI</p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
