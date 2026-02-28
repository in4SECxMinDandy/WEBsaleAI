'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 illustration */}
        <motion.div
          className="text-[120px] font-black text-muted/30 leading-none mb-4 select-none"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Trang không tìm thấy
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          Hãy thử tìm kiếm hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <motion.button
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </motion.button>
          </Link>
          <Link href="/products">
            <motion.button
              className="btn-outline px-6 py-2.5 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-4 h-4" />
              Xem sản phẩm
            </motion.button>
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại trang trước
        </button>
      </motion.div>
    </div>
  );
}
