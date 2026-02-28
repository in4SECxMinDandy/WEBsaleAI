'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin, CreditCard, Truck, ChevronRight, Loader2,
  ShoppingBag, CheckCircle, ArrowLeft,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ordersApi } from '@/lib/api';
import { toast } from '@/components/common/Toast';
import { cn, formatPrice, getProductImageUrl } from '@/lib/utils';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ'),
  province: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
  district: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  ward: z.string().min(1, 'Vui lòng nhập phường/xã'),
  street: z.string().min(5, 'Vui lòng nhập địa chỉ cụ thể'),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'momo', 'vnpay']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
  { value: 'momo', label: 'Ví MoMo', icon: '💜' },
  { value: 'vnpay', label: 'VNPay', icon: '🔵' },
];

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || '',
      paymentMethod: 'cod',
    },
  });

  const selectedPayment = watch('paymentMethod');
  const total = totalPrice();
  const shipping = total >= 500000 ? 0 : 30000;
  const grandTotal = total + shipping;

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">Đăng nhập để tiến hành thanh toán</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">Đăng nhập</Link>
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="section-container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Giỏ hàng trống</h2>
        <p className="text-muted-foreground mb-6">Thêm sản phẩm vào giỏ trước khi thanh toán</p>
        <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">Mua sắm ngay</Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="section-container py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-2xl font-bold">Đặt hàng thành công!</h2>
          <p className="text-muted-foreground">
            Mã đơn hàng: <span className="font-mono font-bold text-foreground">{orderSuccess}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Link href="/orders">
              <button className="btn-primary px-6 py-2.5 text-sm">Xem đơn hàng</button>
            </Link>
            <Link href="/products">
              <button className="btn-outline px-6 py-2.5 text-sm">Tiếp tục mua sắm</button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await ordersApi.create({
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          province: data.province,
          district: data.district,
          ward: data.ward,
          street: data.street,
        },
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
      clearCart();
      setOrderSuccess(res.data.data.orderNumber);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error('Đặt hàng thất bại', msg || 'Vui lòng thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/cart" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Giỏ hàng
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Thanh toán</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping address */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-lg">Địa chỉ giao hàng</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Họ và tên *</label>
                  <input
                    {...register('fullName')}
                    className={cn('input-base', errors.fullName && 'border-destructive')}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Số điện thoại *</label>
                  <input
                    {...register('phone')}
                    className={cn('input-base', errors.phone && 'border-destructive')}
                    placeholder="0901234567"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tỉnh/Thành phố *</label>
                  <select
                    {...register('province')}
                    className={cn('input-base', errors.province && 'border-destructive')}
                  >
                    <option value="">Chọn tỉnh/thành</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.province && <p className="text-xs text-destructive">{errors.province.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Quận/Huyện *</label>
                  <input
                    {...register('district')}
                    className={cn('input-base', errors.district && 'border-destructive')}
                    placeholder="Quận 1"
                  />
                  {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phường/Xã *</label>
                  <input
                    {...register('ward')}
                    className={cn('input-base', errors.ward && 'border-destructive')}
                    placeholder="Phường Bến Nghé"
                  />
                  {errors.ward && <p className="text-xs text-destructive">{errors.ward.message}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">Địa chỉ cụ thể *</label>
                  <input
                    {...register('street')}
                    className={cn('input-base', errors.street && 'border-destructive')}
                    placeholder="123 Nguyễn Huệ"
                  />
                  {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">Ghi chú đơn hàng (tùy chọn)</label>
                  <textarea
                    {...register('notes')}
                    className="input-base h-20 resize-none"
                    placeholder="Giao hàng giờ hành chính, gọi trước khi giao..."
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-lg">Phương thức thanh toán</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedPayment === method.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                        : 'border-border hover:border-primary-200'
                    )}
                  >
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value={method.value}
                      className="sr-only"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                    {selectedPayment === method.value && (
                      <CheckCircle className="w-4 h-4 text-primary-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Order summary */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 p-5 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Đơn hàng của bạn</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.image || getProductImageUrl(undefined)}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className={cn(shipping === 0 && 'text-green-600 font-medium')}>
                    {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Shipping info */}
              <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
                <Truck className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>Giao hàng trong 2-5 ngày làm việc</span>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-4"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  <>Đặt hàng ({formatPrice(grandTotal)})</>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
