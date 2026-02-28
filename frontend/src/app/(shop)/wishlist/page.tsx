'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from '@/components/common/Toast';
import { formatPrice, getProductImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { api } from '@/lib/api';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    images?: Array<{ url: string }>;
    stockQuantity: number;
  };
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { addItem, openCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data.data as WishlistItem[]),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Đã xóa khỏi yêu thích');
    },
  });

  const items = data || [];

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">Đăng nhập để xem danh sách yêu thích</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">Danh sách yêu thích</h1>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground">({items.length} sản phẩm)</span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="product-card animate-pulse">
              <div className="aspect-product bg-muted/60 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted/60 rounded w-full" />
                <div className="h-5 bg-muted/60 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-1">Chưa có sản phẩm yêu thích</p>
          <p className="text-sm text-muted-foreground mb-6">
            Nhấn vào biểu tượng ❤️ trên sản phẩm để lưu vào đây
          </p>
          <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">
            Khám phá sản phẩm
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {items.map((item, i) => {
              const p = item.product;
              const displayPrice = p.salePrice || p.basePrice;
              const imageUrl = getProductImageUrl(p.images);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="product-card group"
                >
                  <Link href={`/product/${p.slug}`}>
                    <div className="relative aspect-product overflow-hidden bg-muted/30">
                      <Image
                        src={imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/product/${p.slug}`}>
                      <p className="text-sm font-medium line-clamp-2 hover:text-primary-600 transition-colors mb-2">
                        {p.name}
                      </p>
                    </Link>
                    <p className="text-sm font-bold text-primary-600 mb-3">
                      {formatPrice(displayPrice)}
                    </p>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => {
                          addItem({
                            productId: p.id,
                            name: p.name,
                            image: imageUrl,
                            price: displayPrice,
                            quantity: 1,
                            slug: p.slug,
                          });
                          openCart();
                          toast.success('Đã thêm vào giỏ hàng', p.name);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        whileTap={{ scale: 0.97 }}
                        disabled={p.stockQuantity === 0}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {p.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </motion.button>
                      <motion.button
                        onClick={() => removeMutation.mutate(p.id)}
                        className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition-colors"
                        whileTap={{ scale: 0.9 }}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              items.forEach((item) => {
                const p = item.product;
                addItem({
                  productId: p.id,
                  name: p.name,
                  image: getProductImageUrl(p.images),
                  price: p.salePrice || p.basePrice,
                  quantity: 1,
                  slug: p.slug,
                });
              });
              openCart();
              toast.success('Đã thêm tất cả vào giỏ hàng');
            }}
            className="btn-outline px-6 py-2.5 text-sm flex items-center gap-2 mx-auto"
          >
            <Package className="w-4 h-4" />
            Thêm tất cả vào giỏ hàng
          </button>
        </div>
      )}
    </div>
  );
}
