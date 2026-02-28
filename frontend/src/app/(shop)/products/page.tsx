'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Grid3X3, List, Search, X, ChevronDown,
  Package, Loader2,
} from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import { ProductCard } from '@/components/shop/ProductCard';
import { cn, debounce } from '@/lib/utils';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

function ProductSkeleton() {
  return (
    <div className="product-card animate-pulse">
      <div className="aspect-product bg-muted/60 rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted/60 rounded w-1/3" />
        <div className="h-4 bg-muted/60 rounded w-full" />
        <div className="h-4 bg-muted/60 rounded w-3/4" />
        <div className="h-5 bg-muted/60 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const category = searchParams.get('category') || '';
  const sort = (searchParams.get('sort') as SortOption) || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete('page'); // reset page on filter change
    router.push(`/products?${params.toString()}`);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((q: string) => updateParams({ q: q || null }), 500),
    [searchParams]
  );

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { category, sort, page, search, minPrice, maxPrice }],
    queryFn: () =>
      productsApi.getAll({
        category,
        sort,
        page,
        limit: 24,
        search,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const products = data?.data || [];
  const total = data?.pagination?.total || data?.meta?.total || 0;
  const totalPages = data?.pagination?.totalPages || data?.meta?.totalPages || 1;

  return (
    <div className="section-container py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {category ? `Danh mục: ${category}` : 'Tất cả sản phẩm'}
        </h1>
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Tìm thấy <span className="font-medium text-foreground">{total}</span> sản phẩm
          </p>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <div className="w-[260px] space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Danh mục</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParams({ category: null })}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        !category ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-950/30' : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      Tất cả
                    </button>
                    {(categoriesData || []).map((cat: { id: string; slug: string; name: string }) => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams({ category: cat.slug })}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          category === cat.slug
                            ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-950/30'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Khoảng giá</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Dưới 100K', min: '', max: '100000' },
                      { label: '100K - 500K', min: '100000', max: '500000' },
                      { label: '500K - 1M', min: '500000', max: '1000000' },
                      { label: '1M - 5M', min: '1000000', max: '5000000' },
                      { label: 'Trên 5M', min: '5000000', max: '' },
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          minPrice === range.min && maxPrice === range.max
                            ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-950/30'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                    {(minPrice || maxPrice) && (
                      <button
                        onClick={() => updateParams({ minPrice: null, maxPrice: null })}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Xóa bộ lọc giá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
                showFilters ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/30' : 'border-border hover:bg-muted'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </button>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                placeholder="Tìm kiếm sản phẩm..."
                className="input-base pl-9 pr-8 h-9 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ q: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="appearance-none input-base h-9 text-sm pr-8 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* View mode */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/30' : 'hover:bg-muted text-muted-foreground')}
                aria-label="Dạng lưới"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/30' : 'hover:bg-muted text-muted-foreground')}
                aria-label="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
            )}>
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">Không tìm thấy sản phẩm</p>
              <p className="text-sm text-muted-foreground mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button
                onClick={() => router.push('/products')}
                className="btn-outline px-4 py-2 text-sm"
              >
                Xóa tất cả bộ lọc
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={cn(
                'grid gap-4',
                viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
              )}
            >
              <AnimatePresence mode="popLayout">
                {products.map((product: Parameters<typeof ProductCard>[0]['product'], i: number) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <ProductCard
                      product={product}
                      variant={viewMode === 'list' ? 'horizontal' : 'default'}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page <= 1}
                className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
              >
                ← Trước
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) })}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page >= totalPages}
                className="btn-outline px-3 py-2 text-sm disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
