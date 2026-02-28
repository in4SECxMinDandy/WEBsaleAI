'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Package } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { ProductCard } from '@/components/shop/ProductCard';

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => productsApi.getAll({ search: query, limit: 24 }).then((r) => r.data),
    enabled: !!query,
    staleTime: 2 * 60 * 1000,
  });

  const products = data?.data || [];
  const total = data?.meta?.total || 0;

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">
            {query ? `Kết quả tìm kiếm: "${query}"` : 'Tìm kiếm sản phẩm'}
          </h1>
        </div>
        {!isLoading && query && (
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `Tìm thấy ${total} sản phẩm`
              : 'Không tìm thấy sản phẩm nào'}
          </p>
        )}
      </div>

      {!query ? (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">Nhập từ khóa để tìm kiếm sản phẩm</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-1">Không tìm thấy sản phẩm</p>
          <p className="text-sm text-muted-foreground">
            Thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm
          </p>
        </motion.div>
      ) : (
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
      )}
    </div>
  );
}
