import { HeroSection } from '@/components/shop/HeroSection';
import { FeaturedCategories } from '@/components/shop/FeaturedCategories';
import { RecommendedProducts } from '@/components/shop/RecommendedProducts';
import { TrendingProducts } from '@/components/shop/TrendingProducts';
import { FlashSaleBanner } from '@/components/shop/FlashSaleBanner';
import { StatsSection } from '@/components/shop/StatsSection';
import { NewsletterSection } from '@/components/shop/NewsletterSection';

export default function HomePage() {
  return (
    <div className="page-enter">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats */}
      <StatsSection />

      {/* Featured Categories */}
      <section className="py-16 bg-background">
        <div className="section-container">
          <FeaturedCategories />
        </div>
      </section>

      {/* Flash Sale Banner */}
      <FlashSaleBanner />

      {/* AI Recommendations — For You */}
      <section className="py-16 bg-muted/30">
        <div className="section-container">
          <RecommendedProducts
            title="🤖 Gợi ý dành cho bạn"
            subtitle="Được cá nhân hóa bởi AI dựa trên hành vi của bạn"
            strategy="hybrid"
            limit={8}
          />
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 bg-background">
        <div className="section-container">
          <TrendingProducts />
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
