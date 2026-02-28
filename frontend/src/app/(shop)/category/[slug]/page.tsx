'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { categoriesApi } from '@/lib/api';
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

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['category-products', slug],
    queryFn: () => categoriesApi.getProducts(slug, { limit: 24 }).then((r) => r.data),
    enabled: !!slug,
  });

  const products = data?.data || [];
  const category = data?.category;
  const total = data?.meta?.total || 0;

  return (
    <div className="section-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-foreground transition-colors">Sản phẩm</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{category?.name || slug}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{category?.name || 'Danh mục'}</h1>
        {category?.description && (
          <p className="text-muted-foreground mt-1">{category.description}</p>
        )}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            {total} sản phẩm
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-1">Chưa có sản phẩm trong danh mục này</p>
          <Link href="/products" className="btn-primary px-6 py-2.5 text-sm mt-4 inline-block">
            Xem tất cả sản phẩm
          </Link>
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
