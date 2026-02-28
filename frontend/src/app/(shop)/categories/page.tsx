'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Grid3X3, ChevronRight } from 'lucide-react';
import { categoriesApi } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: { products: number };
  children?: Category[];
}

const CATEGORY_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-teal-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-green-500',
];

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data.data as Category[]),
    staleTime: 10 * 60 * 1000,
  });

  const categories = data || [];

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Grid3X3 className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Tất cả danh mục</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Chưa có danh mục nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
            >
              <Link href={`/category/${cat.slug}`}>
                <motion.div
                  className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background */}
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                    <p className="font-bold text-lg leading-tight">{cat.name}</p>
                    {cat._count?.products !== undefined && (
                      <p className="text-xs text-white/80 mt-1">{cat._count.products} sản phẩm</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-white/70 group-hover:text-white transition-colors">
                      Xem ngay <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Sub-categories */}
              {cat.children && cat.children.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cat.children.slice(0, 3).map((child) => (
                    <Link key={child.id} href={`/category/${child.slug}`}>
                      <span className="text-xs px-2 py-1 bg-muted rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors">
                        {child.name}
                      </span>
                    </Link>
                  ))}
                  {cat.children.length > 3 && (
                    <span className="text-xs px-2 py-1 text-muted-foreground">
                      +{cat.children.length - 3}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
