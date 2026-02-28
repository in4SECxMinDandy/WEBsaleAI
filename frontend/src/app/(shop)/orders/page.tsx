'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn, formatPrice, formatDate } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Chờ xác nhận', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  confirmed: { label: 'Đã xác nhận', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  processing: { label: 'Đang xử lý', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  shipped: { label: 'Đang giao', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  delivered: { label: 'Đã giao', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  cancelled: { label: 'Đã hủy', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  refunded: { label: 'Đã hoàn tiền', icon: RefreshCw, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30' },
};

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('');
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => ordersApi.getAll({ status: activeTab || undefined }).then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const orders = data || [];

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">Đăng nhập để xem lịch sử đơn hàng của bạn</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all relative',
              activeTab === tab.value ? 'text-primary-600' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <motion.div layoutId="order-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Package className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold mb-1">Chưa có đơn hàng nào</p>
          <p className="text-sm text-muted-foreground mb-6">Hãy mua sắm và đặt hàng đầu tiên của bạn!</p>
          <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">Mua sắm ngay</Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: {
            id: string;
            orderNumber: string;
            status: OrderStatus;
            createdAt: string;
            totalAmount: number;
            orderItems: Array<{ id: string; productName: string; quantity: number; unitPrice: number; productImage?: string }>;
          }, i: number) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
              >
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">#{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </div>
                </div>

                {/* Order items */}
                <div className="px-5 py-4 space-y-3">
                  {order.orderItems?.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {item.productImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.productImage} alt={item.productName || ''} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity} · {formatPrice(item.unitPrice || 0)}</p>
                      </div>
                    </div>
                  ))}
                  {order.orderItems?.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{order.orderItems.length - 2} sản phẩm khác</p>
                  )}
                </div>

                {/* Order footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                  <div>
                    <span className="text-sm text-muted-foreground">Tổng tiền: </span>
                    <span className="font-bold text-primary-600">{formatPrice(order.totalAmount || 0)}</span>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <button className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                      Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
