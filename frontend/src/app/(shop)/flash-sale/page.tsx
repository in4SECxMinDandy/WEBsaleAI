'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Clock, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/shop/ProductCard';

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-4 h-4 text-white/80" />
      <span className="text-sm font-mono font-bold">
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-card animate-pulse">
      <div className="aspect-product bg-muted/60 rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted/60 rounded w-1/3" />
        <div className="h-4 bg-muted/60 rounded w-full" />
        <div className="h-5 bg-muted/60 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function FlashSalePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: () => api.get('/flash-sales/active').then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  const flashSale = data;
  const products = flashSale?.items?.map((item: { product: unknown; salePrice: number }) => ({
    ...(item.product as object),
    salePrice: item.salePrice,
  })) || [];

  return (
    <div>
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="section-container py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-8 h-8 animate-bounce" />
              <h1 className="text-3xl sm:text-4xl font-bold">Flash Sale</h1>
              <Zap className="w-8 h-8 animate-bounce" />
            </div>
            <p className="text-white/90 text-lg">Giảm giá sốc — Số lượng có hạn!</p>

            {flashSale?.endsAt && (
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                <span className="text-sm font-medium">Kết thúc sau:</span>
                <Countdown endsAt={flashSale.endsAt} />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Products */}
      <div className="section-container py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4 opacity-50" />
            <p className="font-semibold text-lg mb-1">Chưa có Flash Sale nào đang diễn ra</p>
            <p className="text-muted-foreground">Hãy quay lại sau để không bỏ lỡ ưu đãi!</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-lg">{products.length} sản phẩm đang giảm giá</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: Parameters<typeof ProductCard>[0]['product'], i: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
