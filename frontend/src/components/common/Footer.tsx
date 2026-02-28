'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Facebook, Instagram, Youtube, Twitter,
  Mail, Phone, MapPin, Shield, Truck, RefreshCw, Headphones,
  ChevronRight,
} from 'lucide-react';

const footerLinks = {
  shop: [
    { label: 'Tất cả sản phẩm', href: '/products' },
    { label: 'Flash Sale', href: '/flash-sale' },
    { label: 'Gợi ý AI', href: '/recommendations' },
    { label: 'Danh mục', href: '/categories' },
    { label: 'Thương hiệu', href: '/brands' },
  ],
  support: [
    { label: 'Trung tâm hỗ trợ', href: '/support' },
    { label: 'Chính sách đổi trả', href: '/return-policy' },
    { label: 'Chính sách vận chuyển', href: '/shipping-policy' },
    { label: 'Hướng dẫn mua hàng', href: '/how-to-buy' },
    { label: 'Liên hệ', href: '/contact' },
  ],
  account: [
    { label: 'Đăng nhập', href: '/login' },
    { label: 'Đăng ký', href: '/register' },
    { label: 'Đơn hàng của tôi', href: '/orders' },
    { label: 'Danh sách yêu thích', href: '/wishlist' },
    { label: 'Cài đặt tài khoản', href: '/profile' },
  ],
  legal: [
    { label: 'Điều khoản sử dụng', href: '/terms' },
    { label: 'Chính sách bảo mật', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const features = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng trên 500K' },
  { icon: RefreshCw, title: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày' },
  { icon: Shield, title: 'Thanh toán an toàn', desc: 'Mã hóa SSL 256-bit' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng giúp bạn' },
];

const socials = [
  { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-500' },
  { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-500' },
  { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-500' },
  { icon: Twitter, href: '#', label: 'Twitter/X', color: 'hover:text-sky-400' },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      {/* Feature highlights */}
      <div className="border-b border-border">
        <div className="section-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <motion.div
                key={f.title}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="text-primary-600">ML</span>
                <span className="text-foreground">Shop</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Nền tảng thương mại điện tử tích hợp AI gợi ý sản phẩm thông minh. 
              Khám phá hàng nghìn sản phẩm được cá nhân hóa cho bạn.
            </p>
            {/* Contact info */}
            <div className="space-y-2">
              <a href="mailto:support@mlshop.vn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4 text-primary-500" />
                support@mlshop.vn
              </a>
              <a href="tel:19001234" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4 text-primary-500" />
                1900 1234 (8:00 - 22:00)
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                123 Nguyễn Huệ, Q.1, TP.HCM
              </div>
            </div>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-2">
              {socials.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground transition-colors duration-200 ${s.color}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <s.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">Mua sắm</h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-600 transition-colors duration-150 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">Hỗ trợ</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-600 transition-colors duration-150 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">Tài khoản</h3>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-600 transition-colors duration-150 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="section-container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MLShop. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
