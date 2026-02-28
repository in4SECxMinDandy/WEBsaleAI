'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Layers, Brain } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ForYouSection, TrendingSection } from '@/components/shop/RecommendationSection';

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="section-container py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
          <Brain className="w-4 h-4" />
          Powered by AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Gợi ý sản phẩm thông minh
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Hệ thống AI phân tích hành vi mua sắm của bạn để đề xuất những sản phẩm phù hợp nhất.
          Càng mua sắm nhiều, gợi ý càng chính xác!
        </p>
      </motion.div>

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            icon: Sparkles,
            title: 'Cá nhân hóa',
            desc: 'AI học từ lịch sử xem và mua hàng của bạn',
            color: 'text-primary-600',
            bg: 'bg-primary-50 dark:bg-primary-950/30',
          },
          {
            icon: Layers,
            title: 'Nội dung tương tự',
            desc: 'Tìm sản phẩm có đặc điểm giống những gì bạn thích',
            color: 'text-accent-600',
            bg: 'bg-accent-50 dark:bg-accent-950/30',
          },
          {
            icon: TrendingUp,
            title: 'Xu hướng',
            desc: 'Sản phẩm đang được nhiều người quan tâm nhất',
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-card rounded-2xl border border-border/50 p-5 text-center"
          >
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-3`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Personalized section */}
      {isAuthenticated ? (
        <section className="mb-10">
          <ForYouSection userId={user?.id} limit={16} />
        </section>
      ) : (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/20 dark:to-accent-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/30 p-8 text-center mb-10">
          <Sparkles className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Đăng nhập để nhận gợi ý cá nhân hóa</h3>
          <p className="text-muted-foreground text-sm mb-4">
            AI sẽ học từ hành vi của bạn và đề xuất sản phẩm phù hợp nhất
          </p>
          <a href="/login" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Đăng nhập ngay
          </a>
        </div>
      )}

      {/* Trending section */}
      <section>
        <TrendingSection limit={16} />
      </section>
    </div>
  );
}
