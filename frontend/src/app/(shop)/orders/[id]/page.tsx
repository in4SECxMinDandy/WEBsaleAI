'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, ChevronRight, Clock, CheckCircle, Truck, XCircle,
  RefreshCw, MapPin, CreditCard, ArrowLeft,
} from 'lucide-react';
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

const ORDER_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id).then((r) => r.data.data),
    enabled: isAuthenticated && !!id,
  });

  const order = data;

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">Đăng nhập</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="section-container py-8 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
        <Link href="/orders" className="btn-primary px-6 py-2.5 text-sm">Xem tất cả đơn hàng</Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const currentStepIndex = ORDER_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="section-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/orders" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Đơn hàng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">#{order.orderNumber}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.color)}>
          <StatusIcon className="w-4 h-4" />
          {statusConfig.label}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Order details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress tracker */}
          {!isCancelled && (
            <div className="bg-card rounded-2xl border border-border/50 p-5">
              <h2 className="font-semibold mb-4">Trạng thái đơn hàng</h2>
              <div className="flex items-center gap-0">
                {ORDER_STEPS.map((step, i) => {
                  const config = STATUS_CONFIG[step];
                  const StepIcon = config.icon;
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;

                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <motion.div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            isCompleted
                              ? 'bg-primary-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                          animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <StepIcon className="w-4 h-4" />
                        </motion.div>
                        <span className={cn(
                          'text-[10px] text-center hidden sm:block',
                          isCompleted ? 'text-primary-600 font-medium' : 'text-muted-foreground'
                        )}>
                          {config.label}
                        </span>
                      </div>
                      {i < ORDER_STEPS.length - 1 && (
                        <div className={cn(
                          'flex-1 h-0.5 mx-1 transition-all',
                          i < currentStepIndex ? 'bg-primary-600' : 'bg-muted'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <h2 className="font-semibold mb-4">Sản phẩm đã đặt</h2>
            <div className="space-y-4">
              {order.orderItems?.map((item: {
                id: string;
                productName: string;
                productImage?: string;
                quantity: number;
                unitPrice: number;
                totalPrice: number;
                product?: { slug: string };
              }) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    {item.productImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImage} alt={item.productName || ''} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(item.unitPrice || 0)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm flex-shrink-0">
                    {formatPrice(item.totalPrice || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
            <h2 className="font-semibold">Thông tin đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-mono font-medium">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày đặt</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã vận đơn</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                <h2 className="font-semibold">Địa chỉ giao hàng</h2>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{(order.shippingAddress as Record<string, string>).fullName}</p>
                <p>{(order.shippingAddress as Record<string, string>).phone}</p>
                <p>{(order.shippingAddress as Record<string, string>).street}, {(order.shippingAddress as Record<string, string>).ward}</p>
                <p>{(order.shippingAddress as Record<string, string>).district}, {(order.shippingAddress as Record<string, string>).province}</p>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold">Thanh toán</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phương thức</span>
                <span className="capitalize">{order.paymentMethod || 'COD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(Number(order.subtotal) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className={cn(Number(order.shippingFee) === 0 && 'text-green-600')}>
                  {Number(order.shippingFee) === 0 ? 'Miễn phí' : formatPrice(Number(order.shippingFee))}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(Number(order.totalAmount) || 0)}</span>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {['pending', 'confirmed'].includes(order.status) && (
            <button
              onClick={async () => {
                if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
                try {
                  await ordersApi.cancel(order.id);
                  window.location.reload();
                } catch {
                  alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
                }
              }}
              className="w-full btn-destructive py-2.5 text-sm"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
