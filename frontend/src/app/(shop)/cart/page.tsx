'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice, getProductImageUrl } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCartStore();
  const count = totalItems();
  const total = totalPrice();
  const shipping = total >= 500000 ? 0 : 30000;

  if (items.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Giỏ hàng trống</h2>
          <p className="text-muted-foreground">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
          <Link href="/products">
            <motion.button
              className="btn-primary px-8 py-3 text-sm font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Khám phá sản phẩm
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng ({count} sản phẩm)</h1>
        <button
          onClick={clearCart}
          className="text-sm text-destructive hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50"
              >
                <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={item.image || getProductImageUrl(undefined)}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`}>
                    <p className="font-medium line-clamp-2 hover:text-primary-600 transition-colors text-sm sm:text-base">
                      {item.name}
                    </p>
                  </Link>
                  <p className="text-primary-600 font-bold mt-1">{formatPrice(item.price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                      <motion.button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Minus className="w-3 h-3" />
                      </motion.button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <motion.button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <motion.button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <h2 className="font-bold text-lg">Tóm tắt đơn hàng</h2>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  className="input-base pl-9 h-9 text-sm"
                />
              </div>
              <button className="btn-outline px-3 py-2 text-sm">Áp dụng</button>
            </div>

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className={cn(shipping === 0 ? 'text-green-600 font-medium' : '')}>
                  {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                </span>
              </div>
              {total < 500000 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  💡 Mua thêm {formatPrice(500000 - total)} để được miễn phí vận chuyển
                </p>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(total + shipping)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block">
              <motion.button
                className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Tiến hành thanh toán
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>

            <Link href="/products" className="block">
              <button className="w-full btn-ghost py-2 text-sm text-muted-foreground">
                ← Tiếp tục mua sắm
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
