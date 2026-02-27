'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Star, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 1,
    title: 'Mua sắm thông minh',
    subtitle: 'với trí tuệ nhân tạo',
    description: 'Hệ thống AI gợi ý sản phẩm cá nhân hóa, giúp bạn tìm đúng thứ mình cần nhanh hơn bao giờ hết.',
    cta: 'Khám phá ngay',
    ctaHref: '/products',
    badge: '🤖 AI-Powered',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    gradient: 'from-blue-600 via-purple-600 to-pink-600',
    accent: 'from-blue-400 to-purple-400',
  },
  {
    id: 2,
    title: 'Flash Sale hôm nay',
    subtitle: 'Giảm đến 70%',
    description: 'Hàng nghìn sản phẩm chất lượng cao với giá ưu đãi cực sốc. Số lượng có hạn!',
    cta: 'Mua ngay',
    ctaHref: '/flash-sale',
    badge: '⚡ Flash Sale',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    accent: 'from-orange-400 to-red-400',
  },
  {
    id: 3,
    title: 'Công nghệ đỉnh cao',
    subtitle: 'Giá tốt nhất thị trường',
    description: 'Laptop, điện thoại, phụ kiện chính hãng với bảo hành toàn quốc và giao hàng nhanh.',
    cta: 'Xem sản phẩm',
    ctaHref: '/category/dien-tu',
    badge: '💻 Tech Store',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    accent: 'from-cyan-400 to-blue-400',
  },
];

const floatingStats = [
  { icon: ShoppingBag, label: 'Đơn hàng', value: '50K+', color: 'text-blue-500' },
  { icon: Star, label: 'Đánh giá 5⭐', value: '98%', color: 'text-yellow-500' },
  { icon: TrendingUp, label: 'Sản phẩm', value: '10K+', color: 'text-green-500' },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const slide = slides[currentSlide];

  return (
    <section className="relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Background gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-90',
            slide.gradient
          )}
        />
      </AnimatePresence>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 noise opacity-30" />

      <div className="section-container relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-white space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {slide.badge}
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  {slide.title}
                  <br />
                  <span className={cn(
                    'bg-gradient-to-r bg-clip-text text-transparent',
                    slide.accent
                  )}>
                    {slide.subtitle}
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/80 max-w-lg leading-relaxed"
              >
                {slide.description}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Link href={slide.ctaHref}>
                  <motion.button
                    className="flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {slide.cta}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/recommendations">
                  <motion.button
                    className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Zap className="w-5 h-5" />
                    Gợi ý AI
                  </motion.button>
                </Link>
              </motion.div>

              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-6 pt-4"
              >
                {floatingStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/70">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Right image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -5 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-white/20 blur-3xl scale-90" />

                {/* Main image */}
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>

                {/* Floating product card */}
                <motion.div
                  className="absolute -bottom-4 -left-8 bg-white dark:bg-card rounded-2xl p-4 shadow-xl border border-border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AI đề xuất</p>
                      <p className="text-sm font-semibold text-foreground">Phù hợp 98%</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating rating */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-xl border border-border"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">4.9/5 (2.4K đánh giá)</p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mt-12">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setCurrentSlide(i);
                setIsAutoPlaying(false);
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
