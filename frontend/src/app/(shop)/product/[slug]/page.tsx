'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, Minus, Plus, Share2, Shield,
  Truck, RefreshCw, ChevronRight, Sparkles, Loader2,
  Package, ZoomIn,
} from 'lucide-react';
import { productsApi, eventsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/common/Toast';
import { SimilarProductsSection } from '@/components/shop/RecommendationSection';
import { cn, formatPrice, getDiscountPercent, getOrCreateSessionId } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).then((r) => r.data.data),
    enabled: !!slug,
  });

  const product = data;

  // Track product view
  useQuery({
    queryKey: ['track-view', slug],
    queryFn: () => {
      if (!product?.id) return null;
      return eventsApi.track({
        sessionId: getOrCreateSessionId(),
        eventType: 'product_view',
        productId: product.id,
      }).catch(() => null);
    },
    enabled: !!product?.id,
    staleTime: Infinity,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images?.[0]?.url,
      price: product.salePrice || product.basePrice,
      quantity,
      slug: product.slug,
    });
    eventsApi.track({
      sessionId: getOrCreateSessionId(),
      eventType: 'add_to_cart',
      productId: product.id,
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    setIsAddingToCart(false);
    openCart();
    toast.success('Đã thêm vào giỏ hàng', product.name);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập', 'Đăng nhập để lưu sản phẩm yêu thích');
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích',
      product?.name
    );
  };

  if (isLoading) {
    return (
      <div className="section-container py-12">
        <div className="grid lg:grid-cols-2 gap-10 animate-pulse">
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-full" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-muted-foreground mb-6">Sản phẩm này không tồn tại hoặc đã bị xóa</p>
        <Link href="/products" className="btn-primary px-6 py-2.5 text-sm">
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images
    : [{ url: 'https://picsum.photos/600/600?grayscale', altText: product.name }];

  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount ? getDiscountPercent(product.basePrice, product.salePrice) : 0;
  const displayPrice = product.salePrice || product.basePrice;

  return (
    <div className="section-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-foreground transition-colors">Sản phẩm</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-foreground transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div className="space-y-3">
          {/* Main image */}
          <motion.div
            className="relative aspect-square rounded-2xl overflow-hidden bg-muted group cursor-zoom-in"
            whileHover={{ scale: 1.01 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.altText || product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </AnimatePresence>
            {hasDiscount && (
              <div className="absolute top-4 left-4 badge-danger text-sm font-bold px-3 py-1">
                -{discountPercent}%
              </div>
            )}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </div>
          </motion.div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: { url: string; altText?: string }, i: number) => (
                <motion.button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                    i === selectedImage ? 'border-primary-500' : 'border-border hover:border-primary-300'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={img.url}
                    alt={img.altText || `Ảnh ${i + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {/* Brand & Category */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.brand && (
              <span className="badge-primary text-xs px-2.5 py-1">{product.brand.name}</span>
            )}
            {product.category && (
              <Link href={`/category/${product.category.slug}`}>
                <span className="text-xs text-muted-foreground hover:text-primary-600 transition-colors">
                  {product.category.name}
                </span>
              </Link>
            )}
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2.5 py-1 rounded-full font-medium">
                <Sparkles className="w-3 h-3" /> Nổi bật
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          {product._count?.reviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product._count.reviews} đánh giá)
              </span>
              {product.purchaseCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  · {product.purchaseCount > 1000 ? `${(product.purchaseCount / 1000).toFixed(1)}K` : product.purchaseCount} đã bán
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through mb-0.5">
                {formatPrice(product.basePrice)}
              </span>
            )}
            {hasDiscount && (
              <span className="badge-danger text-sm font-bold px-2 py-0.5 mb-0.5">
                Tiết kiệm {formatPrice(product.basePrice - product.salePrice)}
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-muted-foreground leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              product.stockQuantity > 10 ? 'bg-green-500' : product.stockQuantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-muted-foreground">
              {product.stockQuantity > 10
                ? 'Còn hàng'
                : product.stockQuantity > 0
                ? `Chỉ còn ${product.stockQuantity} sản phẩm`
                : 'Hết hàng'}
            </span>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <motion.button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                whileTap={{ scale: 0.9 }}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <motion.button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                className="w-8 h-8 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                whileTap={{ scale: 0.9 }}
                disabled={quantity >= product.stockQuantity}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stockQuantity === 0}
              className="flex-1 btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isAddingToCart ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang thêm...</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Thêm vào giỏ hàng</>
              )}
            </motion.button>
            <motion.button
              onClick={handleWishlist}
              className={cn(
                'w-12 h-12 rounded-xl border flex items-center justify-center transition-all',
                isWishlisted
                  ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30'
                  : 'border-border hover:border-red-200 hover:text-red-500'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Thêm vào yêu thích"
            >
              <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
            </motion.button>
            <motion.button
              className="w-12 h-12 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Chia sẻ"
              onClick={() => {
                navigator.share?.({ title: product.name, url: window.location.href })
                  .catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Đã sao chép link', 'Link sản phẩm đã được sao chép');
                  });
              }}
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, text: 'Giao hàng nhanh' },
              { icon: Shield, text: 'Bảo hành chính hãng' },
              { icon: RefreshCw, text: 'Đổi trả 30 ngày' },
            ].map((badge) => (
              <div key={badge.text} className="flex flex-col items-center gap-1.5 p-3 bg-muted/50 rounded-xl text-center">
                <badge.icon className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-muted-foreground">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex gap-1 border-b border-border mb-6">
          {(['description', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-all relative',
                activeTab === tab
                  ? 'text-primary-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'description' ? 'Mô tả' : tab === 'specs' ? 'Thông số' : 'Đánh giá'}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {product.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Chưa có mô tả cho sản phẩm này.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-2">
                {product.attributes?.length > 0 ? (
                  product.attributes.map((attr: { id: string; attributeName: string; attributeValue: string }) => (
                    <div key={attr.id} className="flex gap-4 py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground w-40 flex-shrink-0">{attr.attributeName}</span>
                      <span className="text-sm font-medium">{attr.attributeValue}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Chưa có thông số kỹ thuật.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Similar products */}
      <div className="border-t border-border pt-8">
        <SimilarProductsSection productId={product.id} limit={8} />
      </div>
    </div>
  );
}
