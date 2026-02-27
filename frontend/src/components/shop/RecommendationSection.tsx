'use client';

// ============================================================
// RecommendationSection — Personalized Product Recommendations
// Fetches from Backend → ML Service (Hybrid CF + CB + NCF)
// Supports: "for-you", "similar", "trending" modes
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Layers, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recommendationsApi, eventsApi } from '@/lib/api';
import { ProductCard } from './ProductCard';
import { getOrCreateSessionId } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  category?: { name: string; slug: string };
  brand?: { name: string };
  purchaseCount?: number;
  _count?: { reviews: number };
  score?: number;
  isFeatured?: boolean;
}

type RecommendMode = 'for-you' | 'similar' | 'trending';

interface RecommendationSectionProps {
  /** Display mode */
  mode: RecommendMode;
  /** User ID for personalized recommendations */
  userId?: string;
  /** Product ID for "similar" mode */
  productId?: string;
  /** Category filter */
  categoryId?: string;
  /** Section title (auto-generated if not provided) */
  title?: string;
  /** Max number of products to show */
  limit?: number;
  /** Show ML relevance score bar */
  showScore?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ─── Strategy Icon Map ────────────────────────────────────

const STRATEGY_ICONS: Record<RecommendMode, React.ReactNode> = {
  'for-you': <Sparkles className="w-5 h-5 text-primary-500" />,
  'similar': <Layers className="w-5 h-5 text-accent-500" />,
  'trending': <TrendingUp className="w-5 h-5 text-orange-500" />,
};

const STRATEGY_LABELS: Record<RecommendMode, string> = {
  'for-you': 'Gợi ý cho bạn',
  'similar': 'Sản phẩm tương tự',
  'trending': 'Đang thịnh hành',
};

const STRATEGY_DESCRIPTIONS: Record<RecommendMode, string> = {
  'for-you': 'Được cá nhân hóa bởi AI dựa trên hành vi của bạn',
  'similar': 'Sản phẩm có đặc điểm tương tự',
  'trending': 'Được mua nhiều nhất trong thời gian gần đây',
};

// ─── Skeleton Loader ──────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────

export function RecommendationSection({
  mode,
  userId,
  productId,
  categoryId,
  title,
  limit = 12,
  showScore = true,
  className,
}: RecommendationSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ─── Fetch Recommendations ──────────────────────────────

  const queryKey = ['recommendations', mode, userId, productId, categoryId, limit];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (mode === 'for-you') {
        const res = await recommendationsApi.forYou({
          limit,
          category: categoryId,
        });
        return res.data.data as RecommendedProduct[];
      }

      if (mode === 'similar' && productId) {
        const res = await recommendationsApi.similar(productId, limit);
        return res.data.data as RecommendedProduct[];
      }

      if (mode === 'trending') {
        const res = await recommendationsApi.trending({
          category: categoryId,
          limit,
        });
        return res.data.data as RecommendedProduct[];
      }

      return [];
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes
    retry: 1,
    enabled: mode !== 'similar' || !!productId,
  });

  const products = data || [];

  // ─── Scroll Controls ────────────────────────────────────

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // ─── Track Recommendation Click ─────────────────────────

  const handleProductClick = (product: RecommendedProduct) => {
    recommendationsApi.trackClick({
      productId: product.id,
      strategy: mode,
      sessionId: getOrCreateSessionId(),
    }).catch(() => {});

    eventsApi.track({
      sessionId: getOrCreateSessionId(),
      eventType: 'click_recommendation',
      productId: product.id,
      eventData: { source: mode, score: product.score },
    }).catch(() => {});
  };

  // ─── Don't render if no products and not loading ────────

  if (!isLoading && !isFetching && products.length === 0 && !isError) {
    return null;
  }

  const displayTitle = title || STRATEGY_LABELS[mode];
  const description = STRATEGY_DESCRIPTIONS[mode];

  return (
    <section className={cn('py-8', className)}>
      {/* ── Section Header ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/30">
            {STRATEGY_ICONS[mode]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              {displayTitle}
              {isFetching && !isLoading && (
                <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        {/* Scroll buttons (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <motion.button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'w-9 h-9 rounded-full border border-border flex items-center justify-center',
              'transition-all duration-200',
              canScrollLeft
                ? 'bg-background hover:bg-muted text-foreground shadow-sm'
                : 'opacity-30 cursor-not-allowed bg-muted text-muted-foreground'
            )}
            whileTap={canScrollLeft ? { scale: 0.9 } : {}}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'w-9 h-9 rounded-full border border-border flex items-center justify-center',
              'transition-all duration-200',
              canScrollRight
                ? 'bg-background hover:bg-muted text-foreground shadow-sm'
                : 'opacity-30 cursor-not-allowed bg-muted text-muted-foreground'
            )}
            whileTap={canScrollRight ? { scale: 0.9 } : {}}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── Error State ────────────────────────────────── */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12 text-muted-foreground"
          >
            <div className="text-center">
              <p className="text-sm mb-3">Không thể tải gợi ý sản phẩm</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-primary-600 hover:underline flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3 h-3" />
                Thử lại
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Carousel ───────────────────────────── */}
      <div className="relative">
        {/* Left fade gradient */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
            'bg-gradient-to-r from-background to-transparent',
            'transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Right fade gradient */}
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
            'bg-gradient-to-l from-background to-transparent',
            'transition-opacity duration-300',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[220px] sm:w-[240px] lg:w-[260px]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductSkeleton />
                </div>
              ))
            : products.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="flex-none w-[220px] sm:w-[240px] lg:w-[260px] group"
                  style={{ scrollSnapAlign: 'start' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.06, 0.4),
                    ease: 'easeOut',
                  }}
                >
                  <ProductCard
                    product={product}
                    showScore={showScore}
                    onView={() => handleProductClick(product)}
                  />
                </motion.div>
              ))}
        </div>
      </div>

      {/* ── Mobile scroll hint ─────────────────────────── */}
      {products.length > 3 && (
        <p className="md:hidden text-center text-xs text-muted-foreground mt-3">
          ← Vuốt để xem thêm →
        </p>
      )}
    </section>
  );
}

// ─── Convenience Exports ──────────────────────────────────

/** Personalized "For You" section */
export function ForYouSection({
  userId,
  categoryId,
  limit = 12,
  className,
}: {
  userId?: string;
  categoryId?: string;
  limit?: number;
  className?: string;
}) {
  return (
    <RecommendationSection
      mode="for-you"
      userId={userId}
      categoryId={categoryId}
      limit={limit}
      showScore={true}
      className={className}
    />
  );
}

/** Similar products section */
export function SimilarProductsSection({
  productId,
  limit = 8,
  className,
}: {
  productId: string;
  limit?: number;
  className?: string;
}) {
  return (
    <RecommendationSection
      mode="similar"
      productId={productId}
      limit={limit}
      showScore={false}
      className={className}
    />
  );
}

/** Trending products section */
export function TrendingSection({
  categoryId,
  limit = 12,
  className,
}: {
  categoryId?: string;
  limit?: number;
  className?: string;
}) {
  return (
    <RecommendationSection
      mode="trending"
      categoryId={categoryId}
      limit={limit}
      showScore={false}
      className={className}
    />
  );
}
