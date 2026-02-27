'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Eye, Zap, Sparkles } from 'lucide-react';
import { cn, formatPrice, getDiscountPercent, getProductImageUrl } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { eventsApi } from '@/lib/api';
import { getOrCreateSessionId } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  category?: { name: string; slug: string };
  brand?: { name: string };
  purchaseCount?: number;
  viewCount?: number;
  _count?: { reviews: number };
  score?: number; // ML recommendation score
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  showScore?: boolean;
  variant?: 'default' | 'compact' | 'horizontal';
  className?: string;
  onView?: () => void;
}

export function ProductCard({
  product,
  showScore = false,
  variant = 'default',
  className,
  onView,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem, openCart } = useCartStore();

  const imageUrl = getProductImageUrl(product.images);
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? getDiscountPercent(product.basePrice, product.salePrice!)
    : 0;
  const displayPrice = product.salePrice || product.basePrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);

    addItem({
      productId: product.id,
      name: product.name,
      image: imageUrl,
      price: displayPrice,
      quantity: 1,
      slug: product.slug,
    });

    // Track event
    eventsApi.track({
      sessionId: getOrCreateSessionId(),
      eventType: 'add_to_cart',
      productId: product.id,
    }).catch(() => {});

    setTimeout(() => {
      setIsAddingToCart(false);
      openCart();
    }, 500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleView = () => {
    eventsApi.track({
      sessionId: getOrCreateSessionId(),
      eventType: 'product_view',
      productId: product.id,
    }).catch(() => {});
    onView?.();
  };

  if (variant === 'compact') {
    return (
      <Link href={`/product/${product.slug}`} onClick={handleView}>
        <motion.div
          className={cn('product-card p-3', className)}
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {hasDiscount && (
              <div className="absolute top-2 left-2 badge-danger text-[10px] font-bold px-1.5 py-0.5">
                -{discountPercent}%
              </div>
            )}
          </div>
          <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
          <p className="text-sm font-bold text-primary-600">{formatPrice(displayPrice)}</p>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/product/${product.slug}`} onClick={handleView}>
      <motion.div
        className={cn('product-card', className)}
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Image container */}
        <div className="relative aspect-product overflow-hidden bg-muted/30">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="badge-danger text-xs font-bold px-2 py-1"
              >
                -{discountPercent}%
              </motion.span>
            )}
            {product.isFeatured && (
              <span className="badge-primary text-xs font-bold px-2 py-1">
                ⭐ Nổi bật
              </span>
            )}
            {showScore && product.score && product.score > 0.8 && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI Pick
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
            <motion.button
              onClick={handleWishlist}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200',
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
            </motion.button>
            <motion.button
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center shadow-md transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Quick add to cart */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <motion.button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm',
                'bg-primary-600 text-white shadow-lg',
                'hover:bg-primary-700 active:scale-95 transition-all duration-200',
                isAddingToCart && 'opacity-75 cursor-not-allowed'
              )}
              whileTap={{ scale: 0.98 }}
            >
              {isAddingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Product info */}
        <div className="p-4">
          {/* Category & Brand */}
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <span className="text-xs text-muted-foreground">{product.category.name}</span>
            )}
            {product.brand && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-primary-600">{product.brand.name}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors duration-200">
            {product.name}
          </h3>

          {/* Rating */}
          {product._count && product._count.reviews > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product._count.reviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="ml-2 text-sm text-muted-foreground line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {/* Purchase count */}
            {product.purchaseCount && product.purchaseCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-orange-400" />
                {product.purchaseCount > 1000
                  ? `${(product.purchaseCount / 1000).toFixed(1)}K`
                  : product.purchaseCount} đã bán
              </span>
            )}
          </div>

          {/* ML Score indicator */}
          {showScore && product.score && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary-500" />
                  Độ phù hợp AI
                </span>
                <span className="font-medium text-primary-600">
                  {Math.round(product.score * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${product.score * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
