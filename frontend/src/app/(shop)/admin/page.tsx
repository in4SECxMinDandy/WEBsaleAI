'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  Package, ShoppingCart, Users, TrendingUp, Brain, RefreshCw,
  AlertCircle, CheckCircle, Loader2, ArrowUpRight, Sparkles,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn, formatPrice, formatDate } from '@/lib/utils';

function StatCard({
  title, value, icon: Icon, change, color, isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/50 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-0.5',
            change >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            <ArrowUpRight className={cn('w-3 h-3', change < 0 && 'rotate-180')} />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-8 bg-muted rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats().then((r) => r.data.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
    refetchInterval: 60000,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => adminApi.getTopProducts().then((r) => r.data.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => adminApi.getRecentOrders().then((r) => r.data.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
  });

  const { data: mlModels } = useQuery({
    queryKey: ['admin-ml-models'],
    queryFn: () => adminApi.getMLModels().then((r) => r.data.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
  });

  const [isRetraining, setIsRetraining] = React.useState(false);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
    return (
      <div className="section-container py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
        <p className="text-muted-foreground mb-6">Bạn cần quyền Admin để xem trang này</p>
        <Link href="/" className="btn-primary px-6 py-2.5 text-sm">Về trang chủ</Link>
      </div>
    );
  }

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      await adminApi.triggerRetrain();
      alert('Đã kích hoạt huấn luyện lại mô hình AI. Quá trình này có thể mất vài phút.');
    } catch {
      alert('Không thể kích hoạt huấn luyện. Vui lòng thử lại.');
    } finally {
      setIsRetraining(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: stats ? formatPrice(stats.totalRevenue || 0) : '—',
      icon: TrendingUp,
      color: 'bg-green-500',
      change: stats?.revenueChange,
    },
    {
      title: 'Đơn hàng hôm nay',
      value: stats?.ordersToday ?? '—',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: stats?.ordersChange,
    },
    {
      title: 'Tổng sản phẩm',
      value: stats?.totalProducts ?? '—',
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Người dùng',
      value: stats?.totalUsers ?? '—',
      icon: Users,
      color: 'bg-orange-500',
      change: stats?.usersChange,
    },
  ];

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý toàn bộ hệ thống MLShop</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="btn-outline px-4 py-2 text-sm">
            Quản lý sản phẩm
          </Link>
          <Link href="/admin/orders" className="btn-outline px-4 py-2 text-sm">
            Quản lý đơn hàng
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} isLoading={statsLoading} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-5">
          <h2 className="font-semibold mb-4">Doanh thu 7 ngày qua</h2>
          {stats?.revenueChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* AI Model status */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold">AI Model</h2>
            </div>
            <motion.button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              {isRetraining ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Retrain
            </motion.button>
          </div>

          {mlModels?.length > 0 ? (
            <div className="space-y-3">
              {mlModels.slice(0, 3).map((model: {
                id: string;
                name: string;
                version: string;
                isProduction: boolean;
                trainedAt: string;
                metrics?: Record<string, number>;
              }) => (
                <div key={model.id} className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{model.name || 'Hybrid Model'}</span>
                    {model.isProduction && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" /> Production
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">v{model.version}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(model.trainedAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Chưa có mô hình nào
            </div>
          )}
        </div>
      </div>

      {/* Top products & Recent orders */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Top products */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <h2 className="font-semibold mb-4">Sản phẩm bán chạy</h2>
          {topProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="purchaseCount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Đơn hàng gần đây</h2>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recentOrders?.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order: {
                id: string;
                orderNumber: string;
                status: string;
                totalAmount: number;
                createdAt: string;
              }) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.totalAmount || 0)}</p>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Need React import for useState
import React from 'react';
