'use client';

// ============================================================
// Home Page — ML-Ecommerce Shop
// ============================================================

import { useAuthStore } from '@/store/authStore';
import { HeroSection } from '@/components/shop/HeroSection';
import {
  ForYouSection,
  TrendingSection,
} from '@/components/shop/RecommendationSection';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="page-enter">
      {/* ── Hero ─────────────────────────────────────── */}
      <HeroSection />

      {/* ── AI Recommendations — For You ─────────────── */}
      <section className="py-12 bg-muted/30">
        <div className="section-container">
          <ForYouSection
            userId={user?.id}
            limit={12}
          />
        </div>
      </section>

      {/* ── Trending Products ─────────────────────────── */}
      <section className="py-12 bg-background">
        <div className="section-container">
          <TrendingSection limit={12} />
        </div>
      </section>
    </div>
  );
}
