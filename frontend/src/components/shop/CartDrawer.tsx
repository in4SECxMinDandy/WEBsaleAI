'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice, getProductImageUrl } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCartStore();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const count = totalItems();
  const total = totalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-lg">Giỏ hàng</h2>
                {count > 0 && (
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <motion.button
                onClick={closeCart}
                className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Đóng giỏ hàng"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Giỏ hàng trống</p>
                    <p className="text-sm text-muted-foreground">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
                  </div>
                  <Link href="/products" onClick={closeCart}>
                    <motion.button
                      className="btn-primary px-6 py-2.5 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Khám phá sản phẩm
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3 p-3 bg-card rounded-xl border border-border/50"
                      >
                        {/* Image */}
                        <Link href={`/product/${item.slug}`} onClick={closeCart} className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={item.image || getProductImageUrl(undefined)}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.slug}`} onClick={closeCart}>
                            <p className="text-sm font-medium line-clamp-2 hover:text-primary-600 transition-colors">
                              {item.name}
                            </p>
                          </Link>
                          <p className="text-sm font-bold text-primary-600 mt-1">
                            {formatPrice(item.price)}
                          </p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                              <motion.button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                                whileTap={{ scale: 0.9 }}
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <motion.button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                className="w-7 h-7 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                                whileTap={{ scale: 0.9 }}
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <motion.button
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors ml-auto"
                              whileTap={{ scale: 0.9 }}
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-5 space-y-4 bg-card/50">
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính ({count} sản phẩm)</span>
                    <span className="font-medium">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className={cn(
                      'font-medium',
                      total >= 500000 ? 'text-green-600' : 'text-foreground'
                    )}>
                      {total >= 500000 ? 'Miễn phí' : formatPrice(30000)}
                    </span>
                  </div>
                  {total < 500000 && (
                    <p className="text-xs text-muted-foreground">
                      Mua thêm {formatPrice(500000 - total)} để được miễn phí vận chuyển
                    </p>
                  )}
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="font-semibold">Tổng cộng</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(total >= 500000 ? total : total + 30000)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link href="/checkout" onClick={closeCart} className="block">
                    <motion.button
                      className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Tiến hành thanh toán
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                  <Link href="/cart" onClick={closeCart} className="block">
                    <button className="w-full btn-outline py-2.5 text-sm">
                      Xem giỏ hàng
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
